/**
 * Validated page-content cache configuration.
 * Never hardcode TTLs elsewhere — import from here.
 *
 * Redis: hostname `redis` (Docker) / localhost:6380 (host)
 * Internal port: 6379
 * Logical DB: REDIS_DB (default 0)
 * Namespace: page:content:v1:public:*
 */

const DEFAULTS = {
  schemaVersion: "v1",
  tenant: "public",
  ttlSeconds: 300,
  staleSeconds: 900,
  lockTtlMs: 5000,
  lockWaitMs: 750,
  lockRetryDelayMs: 60,
} as const;

function positiveInt(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.warn(`[CacheConfig] ${name} must be a positive integer — using default ${fallback}`);
    return fallback;
  }
  return parsed;
}

function nonNegInt(raw: string | undefined, fallback: number, name: string): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    console.warn(`[CacheConfig] ${name} must be a non-negative integer — using default ${fallback}`);
    return fallback;
  }
  return parsed;
}

export interface PageCacheConfig {
  schemaVersion: string;
  tenant: string;
  /** Fresh window (HIT). */
  ttlSeconds: number;
  /** Stale grace window after fresh expires (STALE + background refresh). */
  staleSeconds: number;
  /** Total Redis key lifetime = fresh + stale. */
  totalTtlSeconds: number;
  lockTtlMs: number;
  lockWaitMs: number;
  lockRetryDelayMs: number;
  tagSetTtlSeconds: number;
  /** Redis logical DB index (explicit for safety). */
  redisDb: number;
  /** Expose X-Page-Cache debug headers. */
  debugHeaders: boolean;
  /** Emit structured cache logs. */
  debugLogs: boolean;
  staleWhileRevalidate: boolean;
}

let cached: PageCacheConfig | null = null;

export function getPageCacheConfig(): PageCacheConfig {
  if (cached) return cached;

  const ttlSeconds = positiveInt(
    process.env.PAGE_CONTENT_CACHE_TTL_SECONDS ?? process.env.CONTENT_CACHE_TTL_SECONDS,
    DEFAULTS.ttlSeconds,
    "PAGE_CONTENT_CACHE_TTL_SECONDS"
  );

  const staleSeconds = nonNegInt(
    process.env.PAGE_CONTENT_CACHE_STALE_SECONDS,
    DEFAULTS.staleSeconds,
    "PAGE_CONTENT_CACHE_STALE_SECONDS"
  );

  const lockTtlMs = positiveInt(
    process.env.PAGE_CONTENT_CACHE_LOCK_TTL_MS,
    DEFAULTS.lockTtlMs,
    "PAGE_CONTENT_CACHE_LOCK_TTL_MS"
  );

  const lockWaitMs = positiveInt(
    process.env.PAGE_CONTENT_CACHE_LOCK_WAIT_MS,
    DEFAULTS.lockWaitMs,
    "PAGE_CONTENT_CACHE_LOCK_WAIT_MS"
  );

  const totalTtlSeconds = ttlSeconds + Math.max(staleSeconds, 0);
  const isProd = process.env.NODE_ENV === "production";

  cached = {
    schemaVersion:
      (process.env.PAGE_CONTENT_CACHE_SCHEMA_VERSION ?? DEFAULTS.schemaVersion).trim() ||
      DEFAULTS.schemaVersion,
    tenant: (process.env.PAGE_CONTENT_CACHE_TENANT ?? DEFAULTS.tenant).trim() || DEFAULTS.tenant,
    ttlSeconds,
    staleSeconds,
    totalTtlSeconds,
    lockTtlMs,
    lockWaitMs,
    lockRetryDelayMs: DEFAULTS.lockRetryDelayMs,
    tagSetTtlSeconds: totalTtlSeconds + 300,
    redisDb: nonNegInt(process.env.REDIS_DB, 0, "REDIS_DB"),
    debugHeaders: isProd
      ? process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS === "true"
      : process.env.PAGE_CONTENT_CACHE_DEBUG_HEADERS !== "false",
    debugLogs: isProd
      ? process.env.PAGE_CONTENT_CACHE_DEBUG_LOGS === "true"
      : process.env.PAGE_CONTENT_CACHE_DEBUG_LOGS !== "false",
    staleWhileRevalidate: process.env.PAGE_CONTENT_CACHE_SWR !== "false" && staleSeconds > 0,
  };

  return cached;
}

/** Test helper — clears memoized config so env changes take effect. */
export function resetPageCacheConfigForTests(): void {
  cached = null;
}

export function isDev(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Structured cache logs: enabled in non-prod by default, or via PAGE_CONTENT_CACHE_DEBUG_LOGS. */
export function shouldLogCache(): boolean {
  return getPageCacheConfig().debugLogs;
}
