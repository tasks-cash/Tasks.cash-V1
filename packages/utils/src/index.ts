import { LEVEL_TITLES, type LevelInfo } from "@tasks-cash/types";

/** XP required to reach a given level (exponential curve) */
export function xpForLevel(level: number, baseXp = 1000): number {
  return Math.floor(baseXp * Math.pow(1.5, level - 1));
}

/** Calculate level from total XP */
export function levelFromXp(xp: number, baseXp = 1000): number {
  let level = 1;
  let totalRequired = 0;
  while (totalRequired + xpForLevel(level, baseXp) <= xp) {
    totalRequired += xpForLevel(level, baseXp);
    level++;
  }
  return level;
}

/** Progress toward next level (0–100) */
export function xpProgress(xp: number, baseXp = 1000): {
  level: number;
  currentLevelXp: number;
  xpToNextLevel: number;
  progress: number;
} {
  const level = levelFromXp(xp, baseXp);
  let xpUsed = 0;
  for (let i = 1; i < level; i++) {
    xpUsed += xpForLevel(i, baseXp);
  }
  const currentLevelXp = xp - xpUsed;
  const xpToNextLevel = xpForLevel(level, baseXp);
  const progress = Math.min(100, Math.floor((currentLevelXp / xpToNextLevel) * 100));
  return { level, currentLevelXp, xpToNextLevel, progress };
}

/** Get level title based on level number */
export function getLevelTitle(level: number): string {
  const thresholds = Object.keys(LEVEL_TITLES)
    .map(Number)
    .sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (level >= threshold) return LEVEL_TITLES[threshold];
  }
  return LEVEL_TITLES[1];
}

/** Full level info object */
export function getLevelInfo(xp: number, baseXp = 1000): LevelInfo {
  const { level } = xpProgress(xp, baseXp);
  return {
    level,
    xpRequired: xpForLevel(level, baseXp),
    title: getLevelTitle(level),
    perks: getLevelPerks(level),
  };
}

function getLevelPerks(level: number): string[] {
  const perks: string[] = [];
  if (level >= 5) perks.push("+5% coin bonus");
  if (level >= 10) perks.push("Daily mission refresh");
  if (level >= 20) perks.push("Legendary mission access");
  if (level >= 30) perks.push("2x referral bonus");
  if (level >= 50) perks.push("Portal Master badge");
  return perks;
}

/** Generate a unique referral code */
export function generateReferralCode(username: string): string {
  const prefix = username.slice(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "X");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

/** Format coin amount with separator */
export function formatCoins(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}

/** Calculate mission reward with level multiplier */
export function calculateMissionReward(
  baseCoins: number,
  baseXp: number,
  level: number,
  difficulty: string
): { coins: number; xp: number } {
  const diffMultipliers: Record<string, number> = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    epic: 2.5,
    legendary: 3,
  };
  const multiplier = (diffMultipliers[difficulty] ?? 1) * (1 + level * 0.02);
  return {
    coins: Math.floor(baseCoins * multiplier),
    xp: Math.floor(baseXp * multiplier),
  };
}

/** Redis key helpers — ready for cache layer */
export const RedisKeys = {
  leaderboard: (period = "all") => `leaderboard:${period}`,
  userSession: (userId: string) => `session:${userId}`,
  missionCache: (missionId: string) => `mission:${missionId}`,
  rateLimit: (ip: string, route: string) => `ratelimit:${route}:${ip}`,
  workerQueue: "tasks-cash:queue",
} as const;

/** Sleep utility for workers */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export * from "./game";
