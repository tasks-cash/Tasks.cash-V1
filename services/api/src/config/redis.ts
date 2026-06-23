import Redis from "ioredis";

let redis: Redis | null = null;

/** Redis client — lazy init, graceful fallback when unavailable */
export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.REDIS_URL ?? process.env.REDIS_HOST;
  if (!url) return null;

  try {
    redis = new Redis(process.env.REDIS_URL ?? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT ?? 6379}`, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
    });

    return redis;
  } catch {
    console.warn("[Redis] Failed to initialize — running without cache");
    return null;
  }
}

export async function connectRedis(): Promise<void> {
  const client = getRedis();
  if (!client) return;

  try {
    await client.connect();
    console.log("[Redis] Connected");
  } catch {
    console.warn("[Redis] Unavailable — cache disabled");
    redis = null;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const data = await client.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // silent fail — cache is optional
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // silent fail
  }
}
