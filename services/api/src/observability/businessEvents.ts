import { logger } from "./logger";

/**
 * Business domain events — separate from technical HTTP/Mongo logs.
 * AuditLog remains the durable compliance record; these are operational signals.
 */
export type BusinessEvent =
  | "CampaignCreated"
  | "CampaignPublished"
  | "CampaignPaused"
  | "CampaignCompleted"
  | "ChallengeCreated"
  | "ChallengeActivated"
  | "MissionCompleted"
  | "SubmissionApproved"
  | "SubmissionRejected"
  | "RewardIssued"
  | "RewardReversed"
  | "WalletCredited"
  | "WalletAdjusted"
  | "WithdrawalRequested"
  | "LeaderboardUpdated"
  | "LeaderboardRebuilt"
  | "NotificationSent"
  | "NotificationEnqueued"
  | "SeasonFinalized"
  | "AnalyticsIngested";

export function logBusinessEvent(
  event: BusinessEvent,
  fields: {
    entity?: string;
    entityId?: string;
    tenantId?: string;
    userId?: string;
    amount?: string;
    [k: string]: unknown;
  } = {}
): void {
  logger.info(event, {
    category: "business",
    module: "domain",
    operation: event,
    event,
    status: "ok",
    ...fields,
  });
}
