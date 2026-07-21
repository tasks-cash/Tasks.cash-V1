import Redis from "ioredis";
import { randomBytes } from "crypto";
import { getPageCacheConfig } from "./cacheConfig";
import { logRedis } from "../observability/redisEvents";

let redis: Redis | null = null;
let initFailed = false;
let getErrorLogged = false;
let setErrorLogged = false;

/** Bounded reconnect — avoids infinite reconnect log spam. */
const MAX_RECONNECT_ATTEMPTS = 10;

/** Redis client — lazy init, explicit DB index, graceful fallback when unavailable. */
export function getRedis(): Redis | null {
  if (redis) return redis;
  if (initFailed) return null;

  const url =
    process.env.REDIS_URL ??
    (process.env.REDIS_HOST
      ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT ?? 6379}`
      : null);
  if (!url) return null;

  try {
    const cfg = getPageCacheConfig();
    redis = new Redis(url, {
      db: cfg.redisDb,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      // Fail soft quickly when Redis is down — page content must still load from Mongo.
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      commandTimeout: 1_500,
      retryStrategy(times) {
        if (times > MAX_RECONNECT_ATTEMPTS) {
          logRedis("reconnect", {
            error: `Giving up after ${MAX_RECONNECT_ATTEMPTS} attempts`,
          });
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError() {
        return false;
      },
    });

    let errorLogged = false;
    redis.on("error", (err) => {
      if (!errorLogged) {
        logRedis("error", { error: err.message });
        errorLogged = true;
      }
    });
    redis.on("ready", () => {
      errorLogged = false;
      getErrorLogged = false;
      setErrorLogged = false;
      logRedis("connected", {});
    });
    redis.on("reconnecting", () => {
      logRedis("reconnect", {});
    });

    return redis;
  } catch {
    initFailed = true;
    logRedis("error", { error: "Failed to initialize — running without cache" });
    return null;
  }
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    if (client.status === "wait") {
      await client.connect();
    }
    logRedis("connected", { db: getPageCacheConfig().redisDb });
  } catch {
    logRedis("error", { error: "Unavailable — cache disabled" });
    try {
      client.disconnect();
    } catch {
      /* ignore */
    }
    redis = null;
    initFailed = true;
  }
}

export function isRedisReady(): boolean {
  return Boolean(redis && redis.status === "ready");
}

/** Gracefully close the shared Redis client (shutdown and test teardown). */
export async function disconnectRedis(): Promise<void> {
  if (!redis) return;
  const client = redis;
  redis = null;
  try {
    await client.quit();
  } catch {
    client.disconnect();
  }
}

/** True when a Redis client exists and is not known-failed (may still be connecting). */
export function isRedisAvailable(): boolean {
  if (initFailed) return false;
  const client = getRedis();
  return Boolean(client && client.status !== "end");
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  const started = Date.now();
  try {
    const data = await client.get(key);
    getErrorLogged = false;
    const durationMs = Date.now() - started;
    if (data) {
      logRedis("cache_hit", { key, durationMs });
      return JSON.parse(data) as T;
    }
    logRedis("cache_miss", { key, durationMs });
    return null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/timed?\s*out|TimeoutError/i.test(msg)) {
      logRedis("timeout", { key, error: msg, durationMs: Date.now() - started });
    } else if (!getErrorLogged) {
      logRedis("error", { key, error: msg, durationMs: Date.now() - started });
      getErrorLogged = true;
    }
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  const ttl = ttlSeconds ?? getPageCacheConfig().totalTtlSeconds;
  if (!Number.isInteger(ttl) || ttl <= 0) {
    logRedis("error", { key, error: "SETEX refused — TTL must be a positive integer" });
    return false;
  }
  const started = Date.now();
  try {
    const result = await client.setex(key, ttl, JSON.stringify(value));
    setErrorLogged = false;
    logRedis("set", { key, durationMs: Date.now() - started, ttl });
    return result === "OK";
  } catch (err) {
    if (!setErrorLogged) {
      logRedis("error", {
        key,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - started,
      });
      setErrorLogged = true;
    }
    return false;
  }
}

export async function cacheDel(key: string): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    const n = await client.del(key);
    if (n > 0) logRedis("cache_invalidate", { key });
    return n > 0;
  } catch (err) {
    logRedis("error", { key, error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

export async function cacheDelMany(keys: string[]): Promise<number> {
  const client = getRedis();
  if (!client || keys.length === 0) return 0;
  try {
    const n = await client.del(...keys);
    if (n > 0) logRedis("cache_invalidate", { keyCount: keys.length, deleted: n });
    return n;
  } catch (err) {
    logRedis("error", { error: err instanceof Error ? err.message : String(err) });
    return 0;
  }
}

/* ─────────────── Generation counters (invalidation safety) ─────────────── */

export async function bumpCacheGeneration(generationKey: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  try {
    const next = await client.incr(generationKey);
    await client.expire(generationKey, getPageCacheConfig().tagSetTtlSeconds);
    return next;
  } catch (err) {
    logRedis("error", {
      key: generationKey,
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}

export async function getCacheGeneration(generationKey: string): Promise<number> {
  const client = getRedis();
  if (!client) return 0;
  try {
    const raw = await client.get(generationKey);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

/* ─────────────── Distributed lock (stampede protection) ─────────────── */

const RELEASE_LOCK_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`;

export interface LockHandle {
  key: string;
  token: string;
}

export type LockResult =
  | { status: "acquired"; handle: LockHandle }
  | { status: "contended" }
  | { status: "unavailable" };

/** Acquire a lock atomically with SET NX PX. */
export async function tryAcquireLock(key: string, ttlMs: number): Promise<LockResult> {
  const client = getRedis();
  if (!client || !isRedisReady()) return { status: "unavailable" };
  const token = randomBytes(16).toString("hex");
  try {
    const result = await client.set(key, token, "PX", ttlMs, "NX");
    if (result === "OK") {
      logRedis("lock_acquire", { key, acquired: true });
      return { status: "acquired", handle: { key, token } };
    }
    logRedis("lock_fail", { key, acquired: false });
    return { status: "contended" };
  } catch (err) {
    logRedis("error", {
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    return { status: "unavailable" };
  }
}

/** @deprecated Prefer tryAcquireLock for distinguishing unavailable vs contended. */
export async function acquireLock(key: string, ttlMs: number): Promise<LockHandle | null> {
  const result = await tryAcquireLock(key, ttlMs);
  return result.status === "acquired" ? result.handle : null;
}

/** Release a lock only if we still own it (owner-token protected via Lua). */
export async function releaseLock(handle: LockHandle): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;
  try {
    const result = await client.eval(RELEASE_LOCK_LUA, 1, handle.key, handle.token);
    const ok = result === 1;
    logRedis("lock_release", { key: handle.key, acquired: ok });
    return ok;
  } catch (err) {
    logRedis("error", {
      key: handle.key,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/* ─────────────── Tag index (Redis Sets, no KEYS scan) ─────────────── */

/** Register a cache key under multiple tag sets, bounding tag-set lifetime. */
export async function registerKeyTags(
  cacheKey: string,
  tags: string[],
  tagKeyBuilder: (tag: string) => string,
  tagSetTtlSeconds: number
): Promise<void> {
  const client = getRedis();
  if (!client || tags.length === 0) return;
  try {
    const pipeline = client.pipeline();
    for (const tag of tags) {
      const tagKey = tagKeyBuilder(tag);
      pipeline.sadd(tagKey, cacheKey);
      pipeline.expire(tagKey, tagSetTtlSeconds);
    }
    await pipeline.exec();
  } catch (err) {
    logRedis("error", {
      key: cacheKey,
      error: err instanceof Error ? err.message : String(err),
      tagCount: tags.length,
    });
  }
}

/** Remove a cache key from the given tag sets (best-effort prune). */
export async function unregisterKeyFromTags(
  cacheKey: string,
  tags: string[],
  tagKeyBuilder: (tag: string) => string
): Promise<void> {
  const client = getRedis();
  if (!client || tags.length === 0) return;
  try {
    const pipeline = client.pipeline();
    for (const tag of tags) {
      pipeline.srem(tagKeyBuilder(tag), cacheKey);
    }
    await pipeline.exec();
  } catch (err) {
    logRedis("error", {
      key: cacheKey,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Resolve all cache keys registered under the given tags. */
export async function resolveKeysForTags(
  tags: string[],
  tagKeyBuilder: (tag: string) => string
): Promise<{ keys: string[]; tagKeys: string[] }> {
  const client = getRedis();
  if (!client || tags.length === 0) return { keys: [], tagKeys: [] };
  try {
    const tagKeys = tags.map(tagKeyBuilder);
    const pipeline = client.pipeline();
    for (const tagKey of tagKeys) pipeline.smembers(tagKey);
    const results = await pipeline.exec();
    const keys = new Set<string>();
    for (const entry of results ?? []) {
      const members = entry?.[1] as string[] | undefined;
      if (Array.isArray(members)) members.forEach((m) => keys.add(m));
    }
    return { keys: [...keys], tagKeys };
  } catch (err) {
    logRedis("error", { error: err instanceof Error ? err.message : String(err) });
    return { keys: [], tagKeys: [] };
  }
}

export async function getTtl(key: string): Promise<number> {
  const client = getRedis();
  if (!client) return -2;
  try {
    return await client.ttl(key);
  } catch {
    return -2;
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Test helper — disconnect and clear singleton so the next getRedis() re-inits. */
export async function resetRedisForTests(): Promise<void> {
  if (redis) {
    try {
      redis.disconnect();
    } catch {
      /* ignore */
    }
  }
  redis = null;
  initFailed = false;
  getErrorLogged = false;
  setErrorLogged = false;
}
