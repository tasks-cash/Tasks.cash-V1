/** Player Progression System — type definitions (mock UI only) */

export type RankColor = "slate" | "purple" | "violet" | "gold" | "amber" | "cyan" | "rose";

export interface PlayerRankTier {
  id: string;
  name: string;
  icon: string;
  color: RankColor;
  description: string;
  minLevel: number;
}

export interface GlobalLevelData {
  level: number;
  currentXp: number;
  requiredXp: number;
  nextLevel: number;
  nextReward: string;
}

export interface AttributeStat {
  label: string;
  value: string | number;
}

export interface ExplorerAttribute {
  id: string;
  name: string;
  icon: string;
  level: number;
  progress: number;
  purpose: string;
  howToLevelUp: string[];
  stats: AttributeStat[];
  nextReward: string;
  glow: "purple" | "gold" | "violet" | "cyan" | "rose";
}

export type TitleRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface PlayerTitle {
  id: string;
  name: string;
  rarity: TitleRarity;
  description: string;
  unlocked: boolean;
  active?: boolean;
}

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface ProgressionBadge {
  id: string;
  name: string;
  icon: string;
  rarity: BadgeRarity;
  requirement: string;
  unlocked: boolean;
}

export interface AchievementCategory {
  id: string;
  name: string;
  icon: string;
  total: number;
  unlocked: number;
  highlights: { name: string; unlocked: boolean }[];
}

export interface PlayerStatistics {
  daysActive: number;
  totalXpEarned: number;
  missionsCompleted: number;
  raidsJoined: number;
  videosApproved: number;
  referralsActive: number;
  secretsFound: number;
  totalWealth: string;
  seasonRank: number;
  globalRank: number;
}

export interface PlayerProfile {
  username: string;
  avatar: string;
  joinDate: string;
  currentRankId: string;
  rankProgress: number;
  nextRankId: string;
  activeTitleId: string;
}

export interface PlayerProgressionData {
  profile: PlayerProfile;
  ranks: PlayerRankTier[];
  globalLevel: GlobalLevelData;
  attributes: ExplorerAttribute[];
  titles: PlayerTitle[];
  badges: ProgressionBadge[];
  achievementCategories: AchievementCategory[];
  statistics: PlayerStatistics;
  overallCompletion: number;
}
