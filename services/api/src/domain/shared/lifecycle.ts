import { InvalidStatusTransitionError } from "./domainErrors";

/** Lifecycle enums + legal transition maps for domain entities. */

export const CAMPAIGN_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "scheduled",
  "published",
  "running",
  "paused",
  "completed",
  "cancelled",
  "archived",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, readonly CampaignStatus[]> = {
  draft: ["pending_review", "cancelled", "archived"],
  pending_review: ["approved", "draft", "cancelled"],
  approved: ["scheduled", "published", "draft", "cancelled"],
  scheduled: ["published", "running", "paused", "cancelled"],
  published: ["running", "paused", "completed", "cancelled"],
  running: ["paused", "completed", "cancelled"],
  paused: ["running", "completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export const CHALLENGE_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "scheduled",
  "active",
  "paused",
  "completed",
  "cancelled",
  "archived",
] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

export const CHALLENGE_TRANSITIONS: Record<ChallengeStatus, readonly ChallengeStatus[]> = {
  draft: ["pending_review", "cancelled", "archived"],
  pending_review: ["approved", "draft", "cancelled"],
  approved: ["scheduled", "active", "draft", "cancelled"],
  scheduled: ["active", "paused", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "completed", "cancelled"],
  completed: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export const SUBMISSION_STATUSES = [
  "draft",
  "submitted",
  "queued",
  "processing",
  "needs_review",
  "approved",
  "rejected",
  "cancelled",
  "expired",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_TRANSITIONS: Record<SubmissionStatus, readonly SubmissionStatus[]> = {
  draft: ["submitted", "cancelled", "expired"],
  submitted: ["queued", "processing", "needs_review", "approved", "rejected", "cancelled", "expired"],
  queued: ["processing", "needs_review", "cancelled", "expired"],
  processing: ["needs_review", "approved", "rejected", "expired"],
  needs_review: ["approved", "rejected", "cancelled", "expired"],
  approved: [],
  rejected: ["needs_review"],
  cancelled: [],
  expired: [],
};

export const REWARD_STATUSES = [
  "pending",
  "approved",
  "issued",
  "claimed",
  "expired",
  "cancelled",
  "reversed",
  "failed",
] as const;
export type RewardStatus = (typeof REWARD_STATUSES)[number];

export const REWARD_TRANSITIONS: Record<RewardStatus, readonly RewardStatus[]> = {
  pending: ["approved", "cancelled", "failed", "expired"],
  approved: ["issued", "cancelled", "failed", "expired"],
  issued: ["claimed", "reversed", "expired"],
  claimed: ["reversed"],
  expired: [],
  cancelled: [],
  reversed: [],
  failed: ["pending"],
};

export const WALLET_STATUSES = ["active", "restricted", "frozen", "closed"] as const;
export type WalletStatus = (typeof WALLET_STATUSES)[number];

export const SEASON_STATUSES = ["draft", "scheduled", "active", "completed", "archived"] as const;
export type SeasonStatus = (typeof SEASON_STATUSES)[number];

export const NOTIFICATION_STATUSES = [
  "pending",
  "queued",
  "sent",
  "delivered",
  "failed",
  "cancelled",
  "read",
] as const;
export type DomainNotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const VISIBILITIES = ["public", "unlisted", "private"] as const;

export const CHALLENGE_TYPES = [
  "video_hunter",
  "referral_arena",
  "identity_challenge",
  "special_mission",
  "custom",
] as const;
export type DomainChallengeType = (typeof CHALLENGE_TYPES)[number];

export const MISSION_TYPES = [
  "text",
  "image",
  "video",
  "link",
  "qr",
  "referral",
  "profile",
  "social",
  "manual",
  "external",
  "custom",
] as const;

export const TRANSACTION_TYPES = [
  "reward",
  "withdrawal",
  "withdrawal_fee",
  "adjustment",
  "refund",
  "reversal",
  "transfer",
  "hold",
  "release",
] as const;
export type LedgerTransactionType = (typeof TRANSACTION_TYPES)[number];

export const BALANCE_BUCKETS = ["available", "pending", "frozen", "withdrawable"] as const;

export const NOTIFICATION_CHANNELS = ["in_app", "email", "push", "telegram"] as const;

/** Generic status-transition guard. */
export function assertTransition<S extends string>(
  entity: string,
  transitions: Record<S, readonly S[]>,
  from: S,
  to: S
): void {
  if (from === to) return;
  const allowed = transitions[from] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidStatusTransitionError(entity, from, to);
  }
}

export function canTransition<S extends string>(
  transitions: Record<S, readonly S[]>,
  from: S,
  to: S
): boolean {
  return from === to || (transitions[from] ?? []).includes(to);
}
