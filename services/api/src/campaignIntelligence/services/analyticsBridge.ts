/**
 * Privacy-aware product analytics for Campaign Intelligence (no generated text / secrets).
 */

import { AnalyticsEvent } from "../../domain/models/AnalyticsEvent";
import { assertSafeAnalyticsPayload } from "../../analytics/analyticsRedaction";
import { logger } from "../../observability/logger";

export async function recordCampaignAnalytics(input: {
  tenantId: string;
  eventName: string;
  campaignId?: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  try {
    const properties = assertSafeAnalyticsPayload({
      ...(input.properties ?? {}),
      // Explicitly strip any accidental content fields
      body: undefined,
      hook: undefined,
      script: undefined,
      prompt: undefined,
      title: undefined,
    });
    await AnalyticsEvent.create({
      tenantId: input.tenantId,
      appKey: "admin",
      eventName: input.eventName.toLowerCase().replace(/[^a-z0-9._-]/g, "_").slice(0, 96),
      entityType: "intel_campaign",
      entityId: input.campaignId,
      properties,
      source: "api",
      occurredAt: new Date(),
      receivedAt: new Date(),
    });
  } catch (err) {
    logger.warn("campaign.intel.analytics_failed", {
      tenantId: input.tenantId,
      eventName: input.eventName,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}
