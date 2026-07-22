import { getRedis, isRedisReady, releaseLock, tryAcquireLock, type LockHandle } from "../config/redis";
import { getMiraajConfig } from "./config";

const PREFIX = "miraaj:v1";
export interface CachedValue<T> { value: T; cachedAt: string; }

async function read<T>(key: string): Promise<CachedValue<T> | null> {
  const redis = getRedis();
  if (!redis || !isRedisReady()) return null;
  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) as CachedValue<T> : null;
  } catch { return null; }
}

async function write<T>(key: string, value: T, ttl: number): Promise<void> {
  const redis = getRedis();
  if (!redis || !isRedisReady()) return;
  await redis.set(key, JSON.stringify({ value, cachedAt: new Date().toISOString() }), "EX", ttl).catch(() => undefined);
}

export const miraajRedis = {
  healthKey: `${PREFIX}:health`,
  capabilityKey: `${PREFIX}:capabilities`,
  readHealth<T>() { return read<T>(this.healthKey); },
  writeHealth<T>(value: T) { return write(this.healthKey, value, getMiraajConfig().healthCacheTtlSeconds); },
  readCapabilities<T>() { return read<T>(this.capabilityKey); },
  writeCapabilities<T>(value: T) { return write(this.capabilityKey, value, getMiraajConfig().capabilityStaleTtlSeconds); },
  async deleteCaches(): Promise<void> {
    const redis = getRedis();
    if (redis && isRedisReady()) await redis.del(this.healthKey, this.capabilityKey).catch(() => undefined);
  },
  async reserveReplay(identity: string): Promise<"reserved" | "duplicate" | "unavailable"> {
    const redis = getRedis();
    if (!redis || !isRedisReady()) return "unavailable";
    try {
      const result = await redis.set(`${PREFIX}:replay:${identity}`, "1", "EX", getMiraajConfig().webhookReplayTtlSeconds, "NX");
      return result === "OK" ? "reserved" : "duplicate";
    } catch { return "unavailable"; }
  },
  async releaseReplay(identity: string): Promise<void> { const redis = getRedis(); if (redis && isRedisReady()) await redis.del(`${PREFIX}:replay:${identity}`).catch(() => undefined); },
  async rateLimit(bucket: string, identity: string, maximum: number): Promise<{ allowed: boolean; count: number; unavailable: boolean }> {
    const redis = getRedis();
    if (!redis || !isRedisReady()) return { allowed: true, count: 0, unavailable: true };
    const key = `${PREFIX}:rate:${bucket}:${identity}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, getMiraajConfig().rateLimitWindowSeconds);
      return { allowed: count <= maximum, count, unavailable: false };
    } catch { return { allowed: true, count: 0, unavailable: true }; }
  },
  async circuitState(): Promise<{ state: "closed" | "open"; failures: number }> {
    const redis = getRedis(); const cfg = getMiraajConfig();
    if (!redis || !isRedisReady()) return { state: "closed", failures: 0 };
    const key = `${PREFIX}:circuit`;
    try {
      const [failuresRaw, openedRaw] = await redis.hmget(key, "failures", "openedAt");
      const failures = Number(failuresRaw ?? 0); const openedAt = Number(openedRaw ?? 0);
      if (failures >= cfg.circuitBreakerThreshold && Date.now() - openedAt < cfg.circuitBreakerResetMs) return { state: "open", failures };
      if (failures > 0) await redis.del(key);
      return { state: "closed", failures: 0 };
    } catch { return { state: "closed", failures: 0 }; }
  },
  async recordFailure(): Promise<void> {
    const redis = getRedis(); if (!redis || !isRedisReady()) return;
    const key = `${PREFIX}:circuit`; const failures = await redis.hincrby(key, "failures", 1).catch(() => 0);
    if (failures === getMiraajConfig().circuitBreakerThreshold) await redis.hset(key, "openedAt", Date.now()).catch(() => undefined);
    await redis.pexpire(key, getMiraajConfig().circuitBreakerResetMs * 2).catch(() => undefined);
  },
  async recordSuccess(): Promise<void> { const redis = getRedis(); if (redis && isRedisReady()) await redis.del(`${PREFIX}:circuit`).catch(() => undefined); },
  async acquireSync(tenantId: string, executionId: string): Promise<LockHandle | null> {
    const result = await tryAcquireLock(`${PREFIX}:sync:${tenantId}:${executionId}`, getMiraajConfig().synchronizationLockMs);
    return result.status === "acquired" ? result.handle : null;
  },
  releaseSync(handle: LockHandle) { return releaseLock(handle); },
};
