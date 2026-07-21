/**
 * Redis cache for complete campaign intelligence detail payloads.
 * Namespace: campaign:intel:v1:{tenant}:{campaignId} — separate from page:content:*.
 */

import { getRedis } from "../../config/redis";
import { getCampaignIntelligenceConfig } from "../config";
import { logger } from "../../observability/logger";

export function buildCampaignIntelCacheKey(tenantId: string, campaignId: string): string {
  return `campaign:intel:v1:${tenantId}:${campaignId}`;
}

export async function getCachedCampaignDetail(
  tenantId: string,
  campaignId: string
): Promise<Record<string, unknown> | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(buildCampaignIntelCacheKey(tenantId, campaignId));
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function setCachedCampaignDetail(
  tenantId: string,
  campaignId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const ttl = getCampaignIntelligenceConfig().cacheTtlSeconds;
  try {
    await redis.set(
      buildCampaignIntelCacheKey(tenantId, campaignId),
      JSON.stringify(payload),
      "EX",
      ttl
    );
  } catch (err) {
    logger.warn("campaign.intel.cache_set_failed", {
      tenantId,
      campaignId,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}

export async function invalidateCampaignDetailCache(
  tenantId: string,
  campaignId: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(buildCampaignIntelCacheKey(tenantId, campaignId));
  } catch {
    /* ignore */
  }
}
