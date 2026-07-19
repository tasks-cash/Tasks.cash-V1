import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import {
  bumpCacheGeneration,
  cacheGet,
  cacheSet,
  getCacheGeneration,
  getRedis,
  isRedisReady,
  registerKeyTags,
  releaseLock,
  sleep,
  tryAcquireLock,
  unregisterKeyFromTags,
  type LockHandle,
} from "../config/redis";
import { getPageCacheConfig, shouldLogCache } from "../config/cacheConfig";
import {
  buildEnglishFallbackTag,
  buildPageContentCacheKey,
  buildPageContentGenerationKey,
  buildPageContentLockKey,
  buildPageContentTagKey,
  buildPageDependencyTags,
  UnsafeCacheKeyError,
} from "../lib/cache/cacheKeys";
import {
  buildContentPagePayload,
  buildSectionsMap,
  mergeLocaleFallback,
  type ContentPagePayload,
  type ContentRowLike,
} from "../lib/contentService";
import { findCompletePageContentRows, findSharedContentRows } from "../repositories/contentRepository";

export type PageCacheStatus = "HIT" | "MISS" | "STALE";

export interface ContentPageResult {
  payload: ContentPagePayload;
  status: PageCacheStatus;
  cacheKey: string;
}

interface CacheEnvelope {
  payload: ContentPagePayload;
  cachedAt: number;
  freshTtlSeconds: number;
  generation: number;
}

/** In-process guard so we don't fire duplicate background refreshes for the same key. */
const backgroundRefreshInFlight = new Set<string>();

function devLog(tag: string, fields: Record<string, unknown>): void {
  if (shouldLogCache()) console.log(tag, fields);
}

function isValidEnvelope(value: unknown): value is CacheEnvelope {
  if (!value || typeof value !== "object") return false;
  const e = value as CacheEnvelope;
  return Boolean(e.payload && typeof e.cachedAt === "number" && Number.isFinite(e.cachedAt));
}

/** @deprecated Use buildPageContentCacheKey. Kept for backward compatibility. */
export function contentPageCacheKey(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): string {
  return buildPageContentCacheKey({ appKey, pageKey, locale });
}

export function contentPageCacheTtlSeconds(): number {
  return getPageCacheConfig().ttlSeconds;
}

function mergeRows(pageRows: ContentRowLike[], sharedRows: ContentRowLike[]): ContentRowLike[] {
  // Page-specific rows win over shared rows when keys collide.
  const map = new Map<string, ContentRowLike>();
  for (const row of sharedRows) {
    map.set(`${row.sectionKey}::${row.contentKey}`, row);
  }
  for (const row of pageRows) {
    map.set(`${row.sectionKey}::${row.contentKey}`, row);
  }
  return [...map.values()];
}

/** Build the complete one-payload page content from MongoDB (page + shared nav/footer). */
async function buildFreshPayload(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<{ payload: ContentPagePayload; usedEnglishFallback: boolean }> {
  const normalizedPage = pageKey.trim().toLowerCase();
  devLog("[CONTENT MONGO READ START]", { appKey, pageKey: normalizedPage, locale });

  let { pageRows, sharedRows } = await findCompletePageContentRows(appKey, normalizedPage, locale);
  let usedEnglishFallback = false;

  let sections = buildSectionsMap(mergeRows(pageRows, sharedRows));

  if (Object.keys(buildSectionsMap(pageRows)).length === 0 && locale !== "en") {
    const fallback = await findCompletePageContentRows(appKey, normalizedPage, "en");
    pageRows = fallback.pageRows;
    sharedRows = fallback.sharedRows;
    sections = mergeLocaleFallback([], mergeRows(pageRows, sharedRows));
    usedEnglishFallback = pageRows.length > 0 || sharedRows.length > 0;
  } else if (locale !== "en" && sharedRows.length === 0) {
    // Fill shared sections from English when locale has page content but no translated shared rows.
    const sharedEn = await findSharedContentRows(appKey, "en", normalizedPage).catch(
      () => [] as ContentRowLike[]
    );
    if (sharedEn.length > 0) {
      sharedRows = sharedEn;
      sections = buildSectionsMap(mergeRows(pageRows, sharedRows));
      usedEnglishFallback = true;
    }
  }

  const allRows = mergeRows(pageRows, sharedRows);
  devLog("[CONTENT MONGO READ COMPLETE]", {
    appKey,
    pageKey: normalizedPage,
    locale,
    rows: allRows.length,
    usedEnglishFallback,
  });

  const payload = buildContentPagePayload(appKey, normalizedPage, locale, allRows, sections);
  devLog("[CONTENT PAGE BUILT]", {
    appKey,
    pageKey: normalizedPage,
    locale,
    sections: Object.keys(sections).length,
  });
  return { payload, usedEnglishFallback };
}

/** Write payload envelope to Redis and register dependency tags — only if generation matches. */
async function writePayload(
  cacheKey: string,
  parts: { appKey: ContentAppKey; pageKey: string; locale: ContentLocale },
  payload: ContentPagePayload,
  generation: number,
  usedEnglishFallback: boolean
): Promise<boolean> {
  const cfg = getPageCacheConfig();
  const genKey = buildPageContentGenerationKey(parts);
  const currentGen = await getCacheGeneration(genKey);
  if (currentGen !== generation) {
    devLog("[CONTENT REDIS WRITE]", {
      key: cacheKey,
      skipped: true,
      reason: "generation-mismatch",
      expected: generation,
      current: currentGen,
    });
    return false;
  }

  const envelope: CacheEnvelope = {
    payload,
    cachedAt: Date.now(),
    freshTtlSeconds: cfg.ttlSeconds,
    generation,
  };

  const stored = await cacheSet(cacheKey, envelope, cfg.totalTtlSeconds);
  devLog("[CONTENT REDIS WRITE]", { key: cacheKey, ttlSeconds: cfg.totalTtlSeconds, stored });

  if (stored) {
    const tags = buildPageDependencyTags(parts);
    if (usedEnglishFallback && parts.locale !== "en") {
      tags.push(buildEnglishFallbackTag(parts));
    }
    await registerKeyTags(cacheKey, tags, buildPageContentTagKey, cfg.tagSetTtlSeconds);
  }
  return stored;
}

function envelopeAgeSeconds(envelope: CacheEnvelope): number {
  return (Date.now() - envelope.cachedAt) / 1000;
}

/** Best-effort background rebuild (single-flight via distributed lock + generation guard). */
function triggerBackgroundRefresh(
  cacheKey: string,
  parts: { appKey: ContentAppKey; pageKey: string; locale: ContentLocale },
  expectedGeneration: number
): void {
  const cfg = getPageCacheConfig();
  if (!cfg.staleWhileRevalidate) return;
  if (backgroundRefreshInFlight.has(cacheKey)) return;
  backgroundRefreshInFlight.add(cacheKey);

  const lockKey = buildPageContentLockKey(parts);

  void (async () => {
    let lock: LockHandle | null = null;
    try {
      const lockResult = await tryAcquireLock(lockKey, cfg.lockTtlMs);
      if (lockResult.status !== "acquired") return;
      lock = lockResult.handle;
      devLog("[CONTENT BACKGROUND REFRESH START]", { key: cacheKey });
      const { payload, usedEnglishFallback } = await buildFreshPayload(
        parts.appKey,
        parts.pageKey,
        parts.locale
      );
      await writePayload(cacheKey, parts, payload, expectedGeneration, usedEnglishFallback);
      devLog("[CONTENT BACKGROUND REFRESH COMPLETE]", { key: cacheKey });
    } catch (err) {
      console.warn("[CONTENT BACKGROUND REFRESH FAILED]", {
        key: cacheKey,
        error: err instanceof Error ? err.message : "unknown",
      });
    } finally {
      if (lock) await releaseLock(lock);
      backgroundRefreshInFlight.delete(cacheKey);
    }
  })();
}

/**
 * Get the complete page payload with cache, stampede protection, and SWR.
 */
export async function getContentPageResult(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<ContentPageResult> {
  const cfg = getPageCacheConfig();
  const normalizedPage = pageKey.trim().toLowerCase();
  const parts = { appKey, pageKey: normalizedPage, locale };
  const cacheKey = buildPageContentCacheKey(parts);
  const genKey = buildPageContentGenerationKey(parts);
  devLog("[PAGE CACHE KEY]", { key: cacheKey });

  // 1. Try cache
  const cached = await cacheGet<CacheEnvelope>(cacheKey);
  if (isValidEnvelope(cached)) {
    const age = envelopeAgeSeconds(cached);
    const freshTtl = cached.freshTtlSeconds ?? cfg.ttlSeconds;

    if (age < freshTtl) {
      devLog("[CONTENT CACHE HIT]", { key: cacheKey, ageSeconds: Math.round(age) });
      return { payload: cached.payload, status: "HIT", cacheKey };
    }

    // Past fresh window
    if (cfg.staleWhileRevalidate && age < cfg.totalTtlSeconds) {
      devLog("[CONTENT CACHE STALE]", { key: cacheKey, ageSeconds: Math.round(age) });
      const gen = cached.generation ?? (await getCacheGeneration(genKey));
      triggerBackgroundRefresh(cacheKey, parts, gen);
      return { payload: cached.payload, status: "STALE", cacheKey };
    }
    // SWR disabled or beyond stale window → fall through to MISS rebuild
  }

  devLog("[CONTENT CACHE MISS]", { key: cacheKey });

  // 2. Stampede protection — skip wait entirely when Redis is unavailable.
  if (!isRedisReady()) {
    const { payload } = await buildFreshPayload(appKey, normalizedPage, locale);
    return { payload, status: "MISS", cacheKey };
  }

  const lockKey = buildPageContentLockKey(parts);
  const lockResult = await tryAcquireLock(lockKey, cfg.lockTtlMs);

  if (lockResult.status === "unavailable") {
    const { payload } = await buildFreshPayload(appKey, normalizedPage, locale);
    return { payload, status: "MISS", cacheKey };
  }

  if (lockResult.status === "contended") {
    // Someone else is rebuilding — wait briefly, then retry cache (bounded).
    devLog("[CONTENT CACHE LOCK WAIT]", { key: cacheKey });
    const deadline = Date.now() + cfg.lockWaitMs;
    while (Date.now() < deadline) {
      await sleep(cfg.lockRetryDelayMs);
      const retry = await cacheGet<CacheEnvelope>(cacheKey);
      if (isValidEnvelope(retry) && envelopeAgeSeconds(retry) < (retry.freshTtlSeconds ?? cfg.ttlSeconds)) {
        devLog("[CONTENT CACHE HIT]", { key: cacheKey, afterWait: true });
        return { payload: retry.payload, status: "HIT", cacheKey };
      }
    }
    // Fail-safe: rebuild directly rather than waiting forever (do not write without lock).
    const { payload } = await buildFreshPayload(appKey, normalizedPage, locale);
    return { payload, status: "MISS", cacheKey };
  }

  // 3. We own the lock — single MongoDB read + write.
  const lock = lockResult.handle;
  devLog("[CONTENT CACHE LOCK ACQUIRED]", { key: cacheKey });
  try {
    const raced = await cacheGet<CacheEnvelope>(cacheKey);
    if (
      isValidEnvelope(raced) &&
      envelopeAgeSeconds(raced) < (raced.freshTtlSeconds ?? cfg.ttlSeconds)
    ) {
      devLog("[CONTENT CACHE HIT]", { key: cacheKey, afterLock: true });
      return { payload: raced.payload, status: "HIT", cacheKey };
    }

    const generation = await getCacheGeneration(genKey);
    const { payload, usedEnglishFallback } = await buildFreshPayload(appKey, normalizedPage, locale);
    await writePayload(cacheKey, parts, payload, generation, usedEnglishFallback);
    return { payload, status: "MISS", cacheKey };
  } finally {
    await releaseLock(lock);
    devLog("[CONTENT CACHE LOCK RELEASED]", { key: cacheKey });
  }
}

/** Backward-compatible wrapper returning just the payload. */
export async function getContentPage(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<ContentPagePayload> {
  const { payload } = await getContentPageResult(appKey, pageKey, locale);
  return payload;
}

/**
 * Direct single-page invalidation (removes both fresh + stale representation).
 * Bumps generation so in-flight refreshes cannot repopulate stale data.
 */
export async function invalidateContentPageCache(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<void> {
  try {
    const parts = { appKey, pageKey: pageKey.trim().toLowerCase(), locale };
    const cacheKey = buildPageContentCacheKey(parts);
    const genKey = buildPageContentGenerationKey(parts);
    const client = getRedis();
    if (!client) return;

    await bumpCacheGeneration(genKey);
    const deleted = await client.del(cacheKey);
    const tags = buildPageDependencyTags(parts);
    await unregisterKeyFromTags(cacheKey, tags, buildPageContentTagKey);

    devLog("[CONTENT CACHE INVALIDATE]", {
      reason: "page-direct",
      tags: [`content:page:${appKey}:${pageKey}`],
      keysInvalidated: deleted,
    });
  } catch (err) {
    if (err instanceof UnsafeCacheKeyError) {
      console.warn("[CONTENT CACHE INVALIDATE] unsafe key", err.message);
      return;
    }
    console.warn("[CONTENT CACHE INVALIDATE] direct del failed", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

/** Clear in-process background refresh set (tests). */
export function resetBackgroundRefreshForTests(): void {
  backgroundRefreshInFlight.clear();
}

export { UnsafeCacheKeyError };
