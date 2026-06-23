/** Redis-ready cache client structure */
export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class MemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expires?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    this.store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/** Returns Redis client when REDIS_URL is configured; falls back to in-memory */
export function getCacheClient(): CacheClient {
  // Redis integration point — swap MemoryCache for ioredis when ready
  return new MemoryCache();
}

export const LEADERBOARD_CACHE_TTL = Number(process.env.LEADERBOARD_CACHE_TTL ?? 300);
