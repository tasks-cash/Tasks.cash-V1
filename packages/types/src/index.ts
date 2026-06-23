/** Shared TypeScript types for Tasks.cash */

export type UserRole = "user" | "admin" | "moderator";

export type MissionDifficulty = "easy" | "medium" | "hard" | "epic" | "legendary";
export type MissionStatus = "active" | "completed" | "expired" | "locked";

export type RewardType = "coins" | "xp" | "badge" | "item" | "multiplier";
export type RewardRarity = "common" | "rare" | "epic" | "legendary";

export type TransactionType =
  | "mission_reward"
  | "referral_bonus"
  | "purchase"
  | "admin_grant"
  | "withdrawal"
  | "currency_exchange"
  | "treasure_loot"
  | "live_reward"
  | "event_reward"
  | "daily_bonus";

export interface IUser {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  coins: number;
  xp: number;
  level: number;
  referralCode: string;
  referredBy?: string;
  avatar?: string;
  badges: string[];
  completedMissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMission {
  _id: string;
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  coinReward: number;
  xpReward: number;
  category: string;
  requirements?: string[];
  expiresAt?: Date;
  isActive: boolean;
  maxCompletions?: number;
  currentCompletions: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReward {
  _id: string;
  name: string;
  description: string;
  type: RewardType;
  rarity: RewardRarity;
  value: number;
  requiredLevel: number;
  requiredCoins?: number;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ILeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
  completedMissions: number;
}

export interface IReferral {
  _id: string;
  referrerId: string;
  referredUserId: string;
  bonusCoins: number;
  createdAt: Date;
}

export type NotificationType =
  | "mission_complete"
  | "level_up"
  | "referral_bonus"
  | "reward_claimed"
  | "admin_message"
  | "system"
  | "achievement_unlocked"
  | "badge_earned"
  | "treasure_found"
  | "live_reward"
  | "stat_level_up"
  | "event_reward";

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface IUserSettings {
  _id: string;
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  missionAlerts: boolean;
  referralAlerts: boolean;
  leaderboardVisible: boolean;
  theme: "dark" | "system";
  language: string;
  updatedAt: Date;
}

export interface IWalletSummary {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  transactions: ITransaction[];
}

export interface IReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalBonus: number;
  referrals: IReferral[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  user: Omit<IUser, "passwordHash">;
}

export interface DashboardStats {
  coins: number;
  xp: number;
  level: number;
  levelTitle?: string;
  xpToNextLevel: number;
  xpProgress: number;
  completedMissions: number;
  rank?: number;
  referralCount: number;
  referralCode?: string;
  badges?: string[];
  currencies?: import("./game").ICurrencies;
  rpgStats?: import("./game").IRPGStats;
  explorerRank?: string;
  playerTitle?: string;
  achievements?: import("./game").IUserAchievement[];
  streakDays?: number;
  dailyRewardAvailable?: boolean;
}

export * from "./game";
export * from "./mystery-missions";

export interface LevelInfo {
  level: number;
  xpRequired: number;
  title: string;
  perks: string[];
}

export const LEVEL_TITLES: Record<number, string> = {
  1: "Portal Initiate",
  5: "Coin Seeker",
  10: "Mission Runner",
  20: "Void Walker",
  30: "Gold Warden",
  50: "Legend of the Portal",
};

export const DIFFICULTY_COLORS: Record<MissionDifficulty, string> = {
  easy: "#4ade80",
  medium: "#facc15",
  hard: "#f97316",
  epic: "#c084fc",
  legendary: "#a855f7",
};

export const RARITY_COLORS: Record<RewardRarity, string> = {
  common: "#94a3b8",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#fbbf24",
};

// ─── Extended domain models ─────────────────────────────────────

export interface IEmployee {
  _id: string;
  userId: string;
  department: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMissionSubmission {
  _id: string;
  userId: string;
  missionId: string;
  proof: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWallet {
  _id: string;
  userId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWithdrawal {
  _id: string;
  userId: string;
  amount: number;
  method: string;
  status: "pending" | "approved" | "rejected" | "completed";
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILevel {
  _id: string;
  level: number;
  xpRequired: number;
  title: string;
  perks: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaderboard {
  _id: string;
  name: string;
  type: "global" | "weekly" | "monthly";
  entries: ILeaderboardEntry[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChallenge {
  _id: string;
  title: string;
  description: string;
  reward: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITreasure {
  _id: string;
  name: string;
  description: string;
  rarity: RewardRarity;
  requiredLevel: number;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportTicket {
  _id: string;
  userId: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  _id: string;
  actorId: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRole {
  _id: string;
  name: string;
  slug: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  _id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISystemSetting {
  _id: string;
  key: string;
  value: unknown;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}
