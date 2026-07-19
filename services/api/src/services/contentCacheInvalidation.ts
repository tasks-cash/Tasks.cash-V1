import {
  bumpCacheGeneration,
  cacheDelMany,
  cacheDel,
  resolveKeysForTags,
  unregisterKeyFromTags,
} from "../config/redis";
import { getPageCacheConfig, shouldLogCache } from "../config/cacheConfig";
import {
  buildInvalidationTags,
  buildPageContentCacheKey,
  buildPageContentGenerationKey,
  buildPageContentTagKey,
  buildPageDependencyTags,
  classifyCmsMutation,
  isPageContentCacheKey,
  type InvalidationKind,
} from "../lib/cache/cacheKeys";

export type { InvalidationKind };

export interface InvalidationReason {
  kind: InvalidationKind;
  appKey?: string;
  pageKey?: string;
  locale?: string;
}

export interface InvalidationResult {
  reason: string;
  tags: string[];
  keysInvalidated: number;
}

/**
 * Tag-based invalidation. Resolves affected page-cache keys via Redis Sets
 * (never KEYS), deletes only those keys, bumps generations, and prunes tag sets.
 * Only ever touches `page:content:*` and `cache:tag:*` — never sessions,
 * queues, rate-limit, or leaderboard data.
 */
export async function invalidateByReason(
  reason: InvalidationReason
): Promise<InvalidationResult> {
  const tags = buildInvalidationTags(reason);
  const label = reason.appKey
    ? `${reason.kind}:${reason.appKey}${reason.pageKey ? `:${reason.pageKey}` : ""}${
        reason.locale ? `:${reason.locale}` : ""
      }`
    : reason.kind;

  if (tags.length === 0) {
    return { reason: label, tags, keysInvalidated: 0 };
  }

  const { keys, tagKeys } = await resolveKeysForTags(tags, buildPageContentTagKey);

  // Safety: only delete recognized page-content cache keys.
  const safeKeys = keys.filter(isPageContentCacheKey);

  // Bump generation for each key so in-flight SWR refreshes cannot repopulate.
  for (const key of safeKeys) {
    const parts = parsePageContentKey(key);
    if (parts) {
      await bumpCacheGeneration(buildPageContentGenerationKey(parts));
      await unregisterKeyFromTags(key, buildPageDependencyTags(parts), buildPageContentTagKey);
    }
  }

  const keysInvalidated = await cacheDelMany(safeKeys);

  // Prune the now-stale tag index sets for the resolved tags.
  await cacheDelMany(tagKeys);

  if (shouldLogCache()) {
    console.log("[CONTENT CACHE INVALIDATE]", {
      reason: label,
      tags,
      keysInvalidated,
    });
  }

  return { reason: label, tags, keysInvalidated };
}

function parsePageContentKey(
  key: string
): { appKey: string; pageKey: string; locale: string; tenant?: string } | null {
  // page:content:v1:public:main:home:en
  const parts = key.split(":");
  if (parts.length !== 7 || parts[0] !== "page" || parts[1] !== "content") return null;
  return {
    tenant: parts[3],
    appKey: parts[4],
    pageKey: parts[5],
    locale: parts[6],
  };
}

/** Invalidate a set of exact (appKey,pageKey) pages by their dependency tags. */
export async function invalidatePages(
  pages: Array<{ appKey: string; pageKey: string; locale?: string }>
): Promise<InvalidationResult[]> {
  const unique = new Map<string, { appKey: string; pageKey: string; locale?: string }>();
  for (const p of pages) {
    unique.set(`${p.appKey}:${p.pageKey}:${p.locale ?? "*"}`, p);
  }
  return Promise.all(
    [...unique.values()].map((p) =>
      invalidateByReason({
        kind: "page",
        appKey: p.appKey,
        pageKey: p.pageKey,
        locale: p.locale,
      })
    )
  );
}

/**
 * Invalidate after successful CMS mutations.
 * Classifies navigation/footer shared edits vs page edits.
 * Always runs AFTER MongoDB commit.
 */
export async function invalidateAfterCmsMutation(
  blocks: Array<{ appKey: string; pageKey: string; sectionKey: string; locale: string }>
): Promise<InvalidationResult[]> {
  const reasons = new Map<string, InvalidationReason>();

  for (const block of blocks) {
    const reason = classifyCmsMutation(block);
    const key = `${reason.kind}:${reason.appKey}:${reason.pageKey ?? ""}:${reason.locale ?? ""}`;
    reasons.set(key, reason);
  }

  const results: InvalidationResult[] = [];
  for (const reason of reasons.values()) {
    results.push(await invalidateByReason(reason));
  }
  return results;
}

export const contentCacheConfigSummary = () => {
  const cfg = getPageCacheConfig();
  return {
    schemaVersion: cfg.schemaVersion,
    tenant: cfg.tenant,
    ttlSeconds: cfg.ttlSeconds,
    staleSeconds: cfg.staleSeconds,
    lockTtlMs: cfg.lockTtlMs,
    redisDb: cfg.redisDb,
  };
};

export { cacheDel, classifyCmsMutation, buildPageContentCacheKey };
