/** Domain model registry — Phase 2 foundation. */
export { Campaign, CAMPAIGN_TYPES, type ICampaign } from "./Campaign";
export { DomainChallenge, CHALLENGE_DIFFICULTIES, type IDomainChallenge } from "./DomainChallenge";
export { ChallengeTemplate, type IChallengeTemplate } from "./ChallengeTemplate";
export { DomainMission, MISSION_STATUSES, VALIDATION_METHODS, type IDomainMission } from "./DomainMission";
export { Submission, REWARD_ISSUE_STATUSES, type ISubmission } from "./Submission";
export { DomainReward, REWARD_TYPES, type IDomainReward } from "./DomainReward";
export { DomainWallet, type IDomainWallet } from "./DomainWallet";
export {
  WalletTransaction,
  TRANSACTION_DIRECTIONS,
  TRANSACTION_STATUSES,
  TRANSACTION_SOURCE_TYPES,
  type IWalletTransaction,
} from "./WalletTransaction";
export {
  ReferralProgram,
  DomainReferral,
  PROGRAM_STATUSES,
  COMMISSION_TYPES,
  REFERRAL_STATUSES,
  type IReferralProgram,
  type IDomainReferral,
} from "./Referral";
export {
  UserProgress,
  LevelDefinition,
  Badge,
  UserBadge,
  Achievement,
  UserAchievement,
  type IUserProgress,
  type ILevelDefinition,
  type IBadge,
  type IUserBadge,
  type IAchievement,
  type IUserAchievement,
} from "./Progression";
export {
  Season,
  LeaderboardDefinition,
  LeaderboardSnapshot,
  LEADERBOARD_SCOPES,
  LEADERBOARD_METRICS,
  LEADERBOARD_PERIODS,
  LEADERBOARD_STATUSES,
  type ISeason,
  type ILeaderboardDefinition,
  type ILeaderboardSnapshot,
} from "./SeasonLeaderboard";
export {
  DomainNotification,
  NotificationPreference,
  type IDomainNotification,
  type INotificationPreference,
} from "./DomainNotification";
export { AnalyticsEvent, ANALYTICS_SOURCES, type IAnalyticsEvent } from "./AnalyticsEvent";
