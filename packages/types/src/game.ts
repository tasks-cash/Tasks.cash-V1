/** RPG & gamification types for Tasks.cash */

export type CurrencyType =
  | "bronze"
  | "silver"
  | "gold"
  | "diamonds"
  | "crystals"
  | "legendTokens"
  | "mythicCoins"
  | "portalEnergy";

export type RPGStatType =
  | "global"
  | "strength"
  | "intelligence"
  | "speed"
  | "luck"
  | "life"
  | "energy"
  | "defense"
  | "reputation";

export type BadgeTier =
  | "bronze"
  | "silver"
  | "gold"
  | "diamond"
  | "legendary"
  | "mythic"
  | "founder"
  | "earlyExplorer"
  | "vip";

export type TreasureChestType =
  | "hidden"
  | "epic"
  | "legendary"
  | "mythic"
  | "quantum";

export type EventType = "daily" | "weekly" | "monthly" | "global" | "seasonPass";

export type LiveRewardKind =
  | "xp"
  | "currency"
  | "treasure"
  | "achievement"
  | "daily_reward"
  | "referral_bonus"
  | "mission_complete"
  | "level_up"
  | "stat_level_up";

export type MissionDifficulty = "easy" | "medium" | "hard" | "epic" | "legendary";

export interface ICurrencies {
  bronze: number;
  silver: number;
  gold: number;
  diamonds: number;
  crystals: number;
  legendTokens: number;
  mythicCoins: number;
  portalEnergy: number;
}

export interface IRPGStat {
  level: number;
  xp: number;
}

export interface IRPGStats {
  global: IRPGStat;
  strength: IRPGStat;
  intelligence: IRPGStat;
  speed: IRPGStat;
  luck: IRPGStat;
  life: IRPGStat;
  energy: IRPGStat;
  defense: IRPGStat;
  reputation: IRPGStat;
}

export interface IRPGStatProgress extends IRPGStat {
  xpToNextLevel: number;
  progress: number;
  title?: string;
}

export interface IAchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "progression" | "social" | "exploration" | "combat" | "legend";
  requiredLevel?: number;
  requiredMissions?: number;
  requiredReferrals?: number;
  rewardXp?: number;
  rewardCurrency?: Partial<ICurrencies>;
  badgeId?: string;
}

export interface IUserAchievement {
  id: string;
  unlockedAt: string;
}

export interface IBadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
}

export interface IUserBadge {
  id: string;
  earnedAt: string;
}

export interface ITreasureChestDefinition {
  id: string;
  type: TreasureChestType;
  name: string;
  description: string;
  icon: string;
  requiredLevel: number;
  cost?: Partial<ICurrencies>;
  lootTable: Array<{
    weight: number;
    xp?: number;
    currency?: Partial<ICurrencies>;
    badgeId?: string;
    achievementId?: string;
  }>;
}

export interface IUserTreasure {
  chestId: string;
  openedAt: string;
  loot: Record<string, unknown>;
}

export interface IGameEventDefinition {
  id: string;
  type: EventType;
  title: string;
  description: string;
  icon: string;
  startsAt: string;
  endsAt: string;
  rewards: Partial<ICurrencies> & { xp?: number };
  isActive: boolean;
}

export interface ILiveReward {
  id: string;
  kind: LiveRewardKind;
  title: string;
  message: string;
  icon: string;
  xp?: number;
  stat?: RPGStatType;
  statXp?: number;
  currency?: Partial<ICurrencies>;
  achievementId?: string;
  badgeId?: string;
  chestType?: TreasureChestType;
  rarity?: "common" | "rare" | "epic" | "legendary" | "mythic";
}

export interface IPlayerProfile {
  userId: string;
  username: string;
  avatar?: string;
  avatarFrame: string;
  playerTitle: string;
  explorerRank: string;
  globalLevel: number;
  globalXp: number;
  currencies: ICurrencies;
  rpgStats: Record<RPGStatType, IRPGStatProgress>;
  achievements: IUserAchievement[];
  badges: IUserBadge[];
  statistics: IPlayerStatistics;
  streakDays: number;
  dailyRewardAvailable: boolean;
}

export interface IPlayerStatistics {
  missionsCompleted: number;
  treasuresOpened: number;
  achievementsUnlocked: number;
  badgesCollected: number;
  totalXpEarned: number;
  playTimeMinutes: number;
  globalRank: number;
}

export interface ICurrencyTransaction {
  _id?: string;
  userId: string;
  currency: CurrencyType;
  amount: number;
  type: "earn" | "spend" | "exchange" | "reward" | "admin";
  description: string;
  createdAt?: string;
}

export interface IGameDashboard extends IPlayerProfile {
  activeEvents: IGameEventDefinition[];
  availableChests: ITreasureChestDefinition[];
  recentRewards: ILiveReward[];
}
