/**
 * Game Engine — pure game logic (no DB dependencies)
 */

import {
  calculateMissionReward,
  xpProgress,
  getLevelTitle,
  getLevelInfo,
} from "@tasks-cash/utils";

export interface MissionRewardCalculation {
  coins: number;
  xp: number;
  levelTitle: string;
  projectedLevel: number;
  leveledUp: boolean;
}

export interface LeaderboardScore {
  userId: string;
  score: number;
  rank: number;
}

export interface StreakBonus {
  days: number;
  coinMultiplier: number;
  xpMultiplier: number;
}

/** Calculate rewards for completing a mission */
export function calculateCompletionRewards(
  baseCoinReward: number,
  baseXpReward: number,
  userLevel: number,
  userXp: number,
  difficulty: string,
  baseXpPerLevel = 1000
): MissionRewardCalculation {
  const previousLevel = xpProgress(userXp, baseXpPerLevel).level;
  const { coins, xp } = calculateMissionReward(
    baseCoinReward,
    baseXpReward,
    userLevel,
    difficulty
  );
  const newXp = userXp + xp;
  const projectedLevel = xpProgress(newXp, baseXpPerLevel).level;

  return {
    coins,
    xp,
    levelTitle: getLevelTitle(projectedLevel),
    projectedLevel,
    leveledUp: projectedLevel > previousLevel,
  };
}

/** Apply streak multiplier to base rewards */
export function applyStreakBonus(
  coins: number,
  xp: number,
  streakDays: number
): { coins: number; xp: number; bonus: StreakBonus } {
  const bonus = getStreakBonus(streakDays);
  return {
    coins: Math.floor(coins * bonus.coinMultiplier),
    xp: Math.floor(xp * bonus.xpMultiplier),
    bonus,
  };
}

/** Streak bonus tiers */
export function getStreakBonus(streakDays: number): StreakBonus {
  if (streakDays >= 30) return { days: streakDays, coinMultiplier: 2.0, xpMultiplier: 1.5 };
  if (streakDays >= 14) return { days: streakDays, coinMultiplier: 1.5, xpMultiplier: 1.3 };
  if (streakDays >= 7) return { days: streakDays, coinMultiplier: 1.25, xpMultiplier: 1.15 };
  if (streakDays >= 3) return { days: streakDays, coinMultiplier: 1.1, xpMultiplier: 1.05 };
  return { days: streakDays, coinMultiplier: 1, xpMultiplier: 1 };
}

/** Compute leaderboard score from user stats */
export function computeLeaderboardScore(
  xp: number,
  coins: number,
  completedMissions: number,
  level: number
): number {
  return xp + coins * 0.1 + completedMissions * 50 + level * 100;
}

/** Rank users by score */
export function rankLeaderboard(
  entries: Array<{ userId: string; score: number }>
): LeaderboardScore[] {
  return [...entries]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({
      userId: entry.userId,
      score: entry.score,
      rank: index + 1,
    }));
}

/** Check if user can claim a reward */
export function canClaimReward(
  userLevel: number,
  userCoins: number,
  requiredLevel: number,
  requiredCoins?: number
): { allowed: boolean; reason?: string } {
  if (userLevel < requiredLevel) {
    return { allowed: false, reason: `Requires level ${requiredLevel}` };
  }
  if (requiredCoins !== undefined && userCoins < requiredCoins) {
    return { allowed: false, reason: `Requires ${requiredCoins} coins` };
  }
  return { allowed: true };
}

/** Daily bonus coin amount based on level */
export function calculateDailyBonus(level: number, baseBonus = 25): number {
  return Math.floor(baseBonus * (1 + level * 0.05));
}

export { calculateMissionReward, xpProgress, getLevelTitle, getLevelInfo };
