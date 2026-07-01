export type Difficulty = "easy" | "medium" | "hard" | "extreme";
export type MissionStatus = "available" | "in_progress" | "under_review" | "completed" | "expired";
export type GameModeStatus = "live" | "upcoming" | "maintenance";
export type WinnerPeriod = "daily" | "weekly" | "monthly" | "season" | "all_time";
export type RewardPoolPeriod = "daily" | "weekly" | "monthly" | "seasonal";

export interface ArenaOverview {
  activeChallenges: number;
  currentRewardPool: string;
  activePlayers: number;
  nextChallengeCountdown: string;
  todaysWinners: number;
  seasonProgress: number;
  seasonLabel: string;
}

export interface GameMode {
  id: string;
  name: string;
  icon: string;
  description: string;
  activeCount: number;
  rewardType: string;
  difficulty: Difficulty;
  status: GameModeStatus;
  glow: "purple" | "gold" | "violet";
}

export type WinnerCategoryId =
  | "highest_xp"
  | "most_videos"
  | "most_referrals"
  | "most_raids"
  | "most_duels"
  | "highest_strength"
  | "highest_life"
  | "highest_speed"
  | "highest_intelligence"
  | "highest_general";

export interface WinnerCategory {
  id: WinnerCategoryId;
  label: string;
  icon: string;
}

export interface WinnerEntry {
  rank: number;
  avatar: string;
  username: string;
  title: string;
  level: number;
  category: string;
  reward: string;
  badge: string;
}

export interface HardMission {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedTime: string;
  requiredProof: string;
  rewardPreview: string;
  deadline: string;
  progress: number;
  status: MissionStatus;
  glow: "purple" | "gold" | "violet";
}

export interface LevelChampion {
  id: string;
  attribute: string;
  icon: string;
  username: string;
  level: number;
  progress: number;
  badge: string;
  reward: string;
}

export interface CurrencyAmount {
  type: string;
  icon: string;
  amount: string;
}

export interface RewardPoolEntry {
  period: RewardPoolPeriod;
  label: string;
  totalValue: string;
  currencies: CurrencyAmount[];
}

export type ActivityKind = "win" | "level_up" | "mission_complete" | "badge_unlock";

export interface RecentWin {
  id: string;
  avatar: string;
  username: string;
  activityKind: ActivityKind;
  activity: string;
  reward?: string;
  timeAgo: string;
  highlight?: boolean;
}

export interface ChallengesArenaData {
  overview: ArenaOverview;
  nextChallengeEndsAt: string;
  gameModes: GameMode[];
  winnerCategories: WinnerCategory[];
  winnersByPeriod: Record<WinnerPeriod, Record<WinnerCategoryId, WinnerEntry[]>>;
  hardMissions: HardMission[];
  levelChampions: LevelChampion[];
  rewardPools: RewardPoolEntry[];
  recentWins: RecentWin[];
}
