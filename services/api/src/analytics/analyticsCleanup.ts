/**
 * Safe retention cleanup foundations — tenant-aware, non-aggressive.
 */

import { getAnalyticsConfig } from "./analyticsConfig";
import { AnalyticsSession, AnalyticsConsent } from "./analyticsModels";
import { AnalyticsEvent } from "../domain/models/AnalyticsEvent";
import { logger } from "../observability/logger";

export async function cleanupAnalyticsData(options?: {
  dryRun?: boolean;
  tenantId?: string;
}): Promise<{ sessions: number; consents: number; events: number }> {
  const cfg = getAnalyticsConfig();
  const dryRun = options?.dryRun === true;
  const sessionCutoff = new Date(Date.now() - cfg.sessionRetentionDays * 86_400_000);
  const eventCutoff = new Date(Date.now() - cfg.eventRetentionDays * 86_400_000);
  const tenantFilter = options?.tenantId ? { tenantId: options.tenantId } : {};

  const sessionFilter = {
    ...tenantFilter,
    status: { $in: ["ended", "expired"] },
    endedAt: { $lt: sessionCutoff },
  };
  const consentFilter = {
    ...tenantFilter,
    changedAt: { $lt: sessionCutoff },
  };
  const eventFilter = {
    ...tenantFilter,
    receivedAt: { $lt: eventCutoff },
  };

  if (dryRun) {
    const [sessions, consents, events] = await Promise.all([
      AnalyticsSession.countDocuments(sessionFilter),
      AnalyticsConsent.countDocuments(consentFilter),
      AnalyticsEvent.countDocuments(eventFilter),
    ]);
    return { sessions, consents, events };
  }

  const [s, c, e] = await Promise.all([
    AnalyticsSession.deleteMany(sessionFilter),
    AnalyticsConsent.deleteMany(consentFilter),
    // Events also have TTL index; this is an optional explicit cleanup
    AnalyticsEvent.deleteMany(eventFilter),
  ]);

  logger.info("analytics.cleanup.completed", {
    status: "ok",
    sessions: s.deletedCount,
    consents: c.deletedCount,
    events: e.deletedCount,
  });

  return {
    sessions: s.deletedCount ?? 0,
    consents: c.deletedCount ?? 0,
    events: e.deletedCount ?? 0,
  };
}
