import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import {
  bumpCacheGeneration,
  cacheDel,
  cacheGet,
  cacheSet,
  getCacheGeneration,
  getRedis,
  getTtl,
  isRedisReady,
  registerKeyTags,
  releaseLock,
  resolveKeysForTags,
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
  buildCacheRecord,
  classifyCacheRecord,
  computePayloadHash,
  parseCacheRecord,
  type PageCacheRecord,
} from "../lib/cache/cacheEnvelope";
import {
  buildContentPagePayload,
  buildSectionsMap,
  mergeLocaleFallback,
  type ContentPagePayload,
  type ContentRowLike,
} from "../lib/contentService";
import { findCompletePageContentRows, findSharedContentRows } from "../repositories/contentRepository";

export type PageCacheStatus = "HIT" | "MISS" | "STALE" | "DEGRADED";

export interface ContentPageResult {
  payload: ContentPagePayload;
  status: PageCacheStatus;
  cacheKey: string;
  payloadHash?: string;
  cacheVersion?: string;
}

/** In-process guard so we don't fire duplicate background refreshes for the same key. */
const backgroundRefreshInFlight = new Set<string>();

function devLog(tag: string, fields: Record<string, unknown>): void {
  if (shouldLogCache()) console.log(tag, fields);
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
  const map = new Map<string, ContentRowLike>();
  for (const row of sharedRows) {
    map.set(`${row.sectionKey}::${row.contentKey}`, row);
  }
  for (const row of pageRows) {
    map.set(`${row.sectionKey}::${row.contentKey}`, row);
  }
  return [...map.values()];
}

async function buildFreshPayload(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<{ payload: ContentPagePayload; usedEnglishFallback: boolean; durationMs: number }> {
  const normalizedPage = pageKey.trim().toLowerCase();
  const started = Date.now();
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
  const durationMs = Date.now() - started;
  devLog("[CONTENT MONGO READ COMPLETE]", {
    appKey,
    pageKey: normalizedPage,
    locale,
    rows: allRows.length,
    usedEnglishFallback,
    durationMs,
    queryCount: locale !== "en" && usedEnglishFallback ? 2 : sharedRows.length ? 2 : 1,
  });

  const payload = buildContentPagePayload(appKey, normalizedPage, locale, allRows, sections);
  const payloadHash = computePayloadHash(payload);
  devLog("[CONTENT PAGE BUILT]", {
    appKey,
    pageKey: normalizedPage,
    locale,
    sections: Object.keys(sections).length,
    durationMs,
    payloadHash,
  });
  return { payload, usedEnglishFallback, durationMs };
}

async function writePayload(
  cacheKey: string,
  parts: { appKey: ContentAppKey; pageKey: string; locale: ContentLocale },
  payload: ContentPagePayload,
  generation: number,
  usedEnglishFallback: boolean
): Promise<boolean> {
  const cfg = getPageCacheConfig();
  if (!cfg.enabled) return false;

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

  const record = buildCacheRecord(cacheKey, payload, generation);
  const stored = await cacheSet(cacheKey, record, cfg.totalTtlSeconds);
  devLog("[CONTENT REDIS WRITE]", {
    key: cacheKey,
    freshTtlSeconds: cfg.ttlSeconds,
    staleSeconds: cfg.staleSeconds,
    stored,
    payloadHash: record.payloadHash,
  });

  if (stored) {
    const tags = buildPageDependencyTags(parts);
    if (usedEnglishFallback && parts.locale !== "en") {
      tags.push(buildEnglishFallbackTag(parts));
    }
    await registerKeyTags(cacheKey, tags, buildPageContentTagKey, cfg.tagSetTtlSeconds);
    devLog("[CONTENT CACHE TAGS REGISTERED]", { key: cacheKey, tagCount: tags.length });
  }
  return stored;
}

function triggerBackgroundRefresh(
  cacheKey: string,
  parts: { appKey: ContentAppKey; pageKey: string; locale: ContentLocale },
  expectedGeneration: number
): void {
  const cfg = getPageCacheConfig();
  if (!cfg.staleWhileRevalidate || !cfg.enabled) return;
  if (backgroundRefreshInFlight.has(cacheKey)) return;
  backgroundRefreshInFlight.add(cacheKey);

  const lockKey = buildPageContentLockKey(parts);
  const started = Date.now();

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
      devLog("[CONTENT BACKGROUND REFRESH COMPLETE]", {
        key: cacheKey,
        durationMs: Date.now() - started,
      });
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
  const cacheVersion = cfg.schemaVersion;
  devLog("[PAGE CACHE KEY]", { key: cacheKey });

  if (!cfg.enabled) {
    const { payload } = await buildFreshPayload(appKey, normalizedPage, locale);
    return {
      payload,
      status: "MISS",
      cacheKey,
      payloadHash: computePayloadHash(payload),
      cacheVersion,
    };
  }

  // 1. Try cache
  const raw = await cacheGet<unknown>(cacheKey);
  const record = parseCacheRecord(raw);
  if (raw && !record) {
    devLog("[CONTENT CACHE INVALID]", { key: cacheKey, reason: "malformed-json" });
    await cacheDel(cacheKey);
  }

  if (record) {
    const state = classifyCacheRecord(record);
    const ageMs = Date.now() - Date.parse(record.generatedAt);

    if (state === "HIT_FRESH") {
      const remainingFreshSeconds = Math.max(
        0,
        Math.round((Date.parse(record.freshUntil) - Date.now()) / 1000)
      );
      devLog("[CONTENT CACHE HIT]", { key: cacheKey, ageMs, remainingFreshSeconds });
      return {
        payload: record.payload,
        status: "HIT",
        cacheKey,
        payloadHash: record.payloadHash,
        cacheVersion,
      };
    }

    if (state === "HIT_STALE" && cfg.staleWhileRevalidate) {
      const remainingStaleSeconds = Math.max(
        0,
        Math.round((Date.parse(record.staleUntil) - Date.now()) / 1000)
      );
      devLog("[CONTENT CACHE STALE]", { key: cacheKey, ageMs, remainingStaleSeconds });
      triggerBackgroundRefresh(cacheKey, parts, record.generation);
      return {
        payload: record.payload,
        status: "STALE",
        cacheKey,
        payloadHash: record.payloadHash,
        cacheVersion,
      };
    }
  }

  devLog("[CONTENT CACHE MISS]", { key: cacheKey, reason: record ? "expired" : "absent" });

  if (!isRedisReady()) {
    devLog("[CONTENT CACHE DEGRADED]", { reason: "redis-unavailable" });
    const { payload } = await buildFreshPayload(appKey, normalizedPage, locale);
    return {
      payload,
      status: "DEGRADED",
      cacheKey,
      payloadHash: computePayloadHash(payload),
      cacheVersion,
    };
  }

  const lockKey = buildPageContentLockKey(parts);
  const lockResult = await tryAcquireLock(lockKey, cfg.lockTtlMs);

  if (lockResult.status === "unavailable") {
    devLog("[CONTENT CACHE DEGRADED]", { reason: "lock-unavailable" });
    const { payload } = await buildFreshPayload(appKey, normalizedPage, locale);
    return {
      payload,
      status: "DEGRADED",
      cacheKey,
      payloadHash: computePayloadHash(payload),
      cacheVersion,
    };
  }

  if (lockResult.status === "contended") {
    const waitStarted = Date.now();
    devLog("[CONTENT CACHE LOCK WAIT]", { key: cacheKey, elapsedMs: 0 });
    const deadline = Date.now() + cfg.lockWaitMs;
    while (Date.now() < deadline) {
      await sleep(cfg.lockRetryDelayMs);
      const retryRaw = await cacheGet<unknown>(cacheKey);
      const retry = parseCacheRecord(retryRaw);
      if (retry && classifyCacheRecord(retry) === "HIT_FRESH") {
        devLog("[CONTENT CACHE HIT]", {
          key: cacheKey,
          afterWait: true,
          elapsedMs: Date.now() - waitStarted,
        });
        return {
          payload: retry.payload,
          status: "HIT",
          cacheKey,
          payloadHash: retry.payloadHash,
          cacheVersion,
        };
      }
    }
    devLog("[CONTENT CACHE LOCK TIMEOUT]", {
      key: cacheKey,
      elapsedMs: Date.now() - waitStarted,
    });
    const { payload } = await buildFreshPayload(appKey, normalizedPage, locale);
    return {
      payload,
      status: "MISS",
      cacheKey,
      payloadHash: computePayloadHash(payload),
      cacheVersion,
    };
  }

  const lock = lockResult.handle;
  devLog("[CONTENT CACHE LOCK ACQUIRED]", { key: cacheKey, lockKey });
  try {
    const racedRaw = await cacheGet<unknown>(cacheKey);
    const raced = parseCacheRecord(racedRaw);
    if (raced && classifyCacheRecord(raced) === "HIT_FRESH") {
      return {
        payload: raced.payload,
        status: "HIT",
        cacheKey,
        payloadHash: raced.payloadHash,
        cacheVersion,
      };
    }

    const generation = await getCacheGeneration(genKey);
    const { payload, usedEnglishFallback } = await buildFreshPayload(appKey, normalizedPage, locale);
    await writePayload(cacheKey, parts, payload, generation, usedEnglishFallback);
    return {
      payload,
      status: "MISS",
      cacheKey,
      payloadHash: computePayloadHash(payload),
      cacheVersion,
    };
  } finally {
    await releaseLock(lock);
    devLog("[CONTENT CACHE LOCK RELEASED]", { key: cacheKey, lockKey });
  }
}

export async function getContentPage(
  appKey: ContentAppKey,
  pageKey: string,
  locale: ContentLocale
): Promise<ContentPagePayload> {
  const { payload } = await getContentPageResult(appKey, pageKey, locale);
  return payload;
}

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

/** Admin inspector: read cache metadata without returning full payload. */
export async function inspectPageCache(parts: {
  appKey: string;
  pageKey: string;
  locale: string;
}): Promise<{
  cacheKey: string;
  state: string;
  ttlSeconds: number;
  record: Omit<PageCacheRecord, "payload"> | null;
  tags: string[];
}> {
  const cacheKey = buildPageContentCacheKey(parts);
  const raw = await cacheGet<unknown>(cacheKey);
  const record = parseCacheRecord(raw);
  const ttlSeconds = await getTtl(cacheKey);
  const tags = buildPageDependencyTags(parts);
  const { keys } = await resolveKeysForTags(tags, buildPageContentTagKey);
  const registeredTags = tags.filter(() => keys.includes(cacheKey));

  let state = "MISS";
  if (raw && !record) state = "INVALID";
  else if (record) {
    const classified = classifyCacheRecord(record);
    state =
      classified === "HIT_FRESH" ? "HIT" : classified === "HIT_STALE" ? "STALE" : "EXPIRED";
  }

  if (!record) {
    return { cacheKey, state, ttlSeconds, record: null, tags: registeredTags };
  }

  const { payload: _payload, ...meta } = record;
  return { cacheKey, state, ttlSeconds, record: meta, tags: registeredTags.length ? registeredTags : tags };
}

/** Admin rebuild: force Mongo read + Redis write. */
export async function rebuildPageCache(parts: {
  appKey: ContentAppKey;
  pageKey: string;
  locale: ContentLocale;
}): Promise<{ cacheKey: string; payloadHash: string }> {
  const normalized = {
    appKey: parts.appKey,
    pageKey: parts.pageKey.trim().toLowerCase(),
    locale: parts.locale,
  };
  const cacheKey = buildPageContentCacheKey(normalized);
  const genKey = buildPageContentGenerationKey(normalized);
  await bumpCacheGeneration(genKey);
  await cacheDel(cacheKey);
  const generation = await getCacheGeneration(genKey);
  const { payload, usedEnglishFallback } = await buildFreshPayload(
    normalized.appKey,
    normalized.pageKey,
    normalized.locale
  );
  await writePayload(cacheKey, normalized, payload, generation, usedEnglishFallback);
  return { cacheKey, payloadHash: computePayloadHash(payload) };
}

export function resetBackgroundRefreshForTests(): void {
  backgroundRefreshInFlight.clear();
}

export { UnsafeCacheKeyError, computePayloadHash };
