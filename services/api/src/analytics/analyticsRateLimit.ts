/**
 * Redis-backed sliding window rate limit for public analytics ingest.
 */

import { getRedis } from "../config/redis";
import { RedisKeys } from "@tasks-cash/utils";
import { AnalyticsRateLimitError } from "./analyticsErrors";
import { getAnalyticsConfig } from "./analyticsConfig";
import { analyticsMetrics } from "./analyticsMetrics";

export async function assertAnalyticsRateLimit(ip: string, route = "analytics-ingest"): Promise<void> {
  const cfg = getAnalyticsConfig();
  const redis = getRedis();
  if (!redis) return; // fail open when Redis down — still validated elsewhere

  const key = RedisKeys.rateLimit(ip || "unknown", route);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  if (count > cfg.rateLimitPerMinute) {
    analyticsMetrics.rateLimited();
    throw new AnalyticsRateLimitError();
  }
}
