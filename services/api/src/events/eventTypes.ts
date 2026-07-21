/**
 * Stable domain event type names: domain.entity.action.vN
 */

export const EVENT_TYPES = {
  // Identity
  USER_REGISTERED: "identity.user.registered.v1",
  USER_LOGGED_IN: "identity.user.logged_in.v1",

  // Campaign
  CAMPAIGN_CREATED: "campaign.campaign.created.v1",
  CAMPAIGN_UPDATED: "campaign.campaign.updated.v1",
  CAMPAIGN_PUBLISHED: "campaign.campaign.published.v1",
  CAMPAIGN_PAUSED: "campaign.campaign.paused.v1",
  CAMPAIGN_RESUMED: "campaign.campaign.resumed.v1",
  CAMPAIGN_COMPLETED: "campaign.campaign.completed.v1",

  // Challenge
  CHALLENGE_CREATED: "challenge.challenge.created.v1",
  CHALLENGE_ACTIVATED: "challenge.challenge.activated.v1",
  CHALLENGE_PAUSED: "challenge.challenge.paused.v1",
  CHALLENGE_COMPLETED: "challenge.challenge.completed.v1",

  // Mission
  MISSION_STARTED: "mission.mission.started.v1",
  MISSION_COMPLETED: "mission.mission.completed.v1",

  // Submission
  SUBMISSION_CREATED: "submission.submission.created.v1",
  SUBMISSION_QUEUED: "submission.submission.queued.v1",
  SUBMISSION_APPROVED: "submission.submission.approved.v1",
  SUBMISSION_REJECTED: "submission.submission.rejected.v1",

  // Reward / wallet
  REWARD_ISSUED: "reward.reward.issued.v1",
  REWARD_REVERSED: "reward.reward.reversed.v1",
  WALLET_CREDITED: "wallet.wallet.credited.v1",
  WALLET_DEBITED: "wallet.wallet.debited.v1",
  WALLET_ADJUSTED: "wallet.wallet.adjusted.v1",

  // Referral
  REFERRAL_CREATED: "referral.referral.created.v1",
  REFERRAL_CONVERTED: "referral.referral.converted.v1",
  REFERRAL_COMPLETED: "referral.referral.completed.v1",

  // Progress
  XP_AWARDED: "progress.xp.awarded.v1",
  LEVEL_CHANGED: "progress.level.changed.v1",
  BADGE_AWARDED: "progress.badge.awarded.v1",
  ACHIEVEMENT_COMPLETED: "progress.achievement.completed.v1",

  // Leaderboard
  LEADERBOARD_UPDATED: "leaderboard.leaderboard.updated.v1",
  SEASON_STARTED: "leaderboard.season.started.v1",
  SEASON_FINALIZED: "leaderboard.season.finalized.v1",

  // Notification
  NOTIFICATION_QUEUED: "notification.notification.queued.v1",
  NOTIFICATION_DELIVERED: "notification.notification.delivered.v1",
  NOTIFICATION_FAILED: "notification.notification.failed.v1",

  // AI (foundation)
  AI_JOB_REQUESTED: "ai.job.requested.v1",
  AI_JOB_STARTED: "ai.job.started.v1",
  AI_JOB_COMPLETED: "ai.job.completed.v1",
  AI_JOB_FAILED: "ai.job.failed.v1",

  // Analytics (contracts)
  ANALYTICS_PRODUCT_RECORDED: "analytics.product.event_recorded.v1",
  ANALYTICS_ATTRIBUTION_CAPTURED: "analytics.attribution.captured.v1",
  ANALYTICS_CONVERSION_RECORDED: "analytics.conversion.recorded.v1",
  ANALYTICS_SESSION_STARTED: "analytics.session.started.v1",
  ANALYTICS_SESSION_ENDED: "analytics.session.ended.v1",
  ANALYTICS_PAGE_VIEWED: "analytics.page.viewed.v1",
  ANALYTICS_SECTION_VIEWED: "analytics.section.viewed.v1",
  ANALYTICS_CTA_CLICKED: "analytics.cta.clicked.v1",
  ANALYTICS_FORM_STARTED: "analytics.form.started.v1",
  ANALYTICS_FORM_COMPLETED: "analytics.form.completed.v1",
  ANALYTICS_FORM_ABANDONED: "analytics.form.abandoned.v1",
  ANALYTICS_SESSION_HEARTBEAT: "analytics.session.heartbeat.v1",
  ANALYTICS_PAGE_LEFT: "analytics.page.left.v1",
  ANALYTICS_SCROLL_DEPTH: "analytics.scroll.depth_reached.v1",
  ANALYTICS_LINK_CLICKED: "analytics.link.clicked.v1",
  ANALYTICS_FEATURE_USED: "analytics.feature.used.v1",
  ANALYTICS_FORM_STEP_COMPLETED: "analytics.form.step_completed.v1",
  ANALYTICS_SEARCH_PERFORMED: "analytics.search.performed.v1",
  ANALYTICS_CHALLENGE_VIEWED: "analytics.challenge.viewed.v1",
  ANALYTICS_CHALLENGE_JOINED: "analytics.challenge.joined.v1",
  ANALYTICS_MISSION_STARTED: "analytics.mission.started.v1",
  ANALYTICS_MISSION_COMPLETED: "analytics.mission.completed.v1",
  ANALYTICS_SUBMISSION_CREATED: "analytics.submission.created.v1",
  ANALYTICS_REWARD_RECEIVED: "analytics.reward.received.v1",
  ANALYTICS_IDENTITY_RESOLVED: "analytics.identity.resolved.v1",
  ANALYTICS_CONSENT_UPDATED: "analytics.consent.updated.v1",
  ANALYTICS_EXPERIMENT_EXPOSED: "analytics.experiment.exposed.v1",

  // System / workflow
  WORKFLOW_STARTED: "system.workflow.started.v1",
  WORKFLOW_STEP_COMPLETED: "system.workflow.step_completed.v1",
  WORKFLOW_COMPLETED: "system.workflow.completed.v1",
  WORKFLOW_FAILED: "system.workflow.failed.v1",
} as const;

export type RegisteredEventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

export function parseEventVersion(eventType: string): { base: string; version: number } | null {
  const m = eventType.match(/^(.*)\.v(\d+)$/);
  if (!m) return null;
  return { base: m[1], version: Number(m[2]) };
}
