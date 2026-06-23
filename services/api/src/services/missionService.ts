import mongoose from "mongoose";
import { calculateCompletionRewards } from "@tasks-cash/game-engine";
import { addCurrency, addStatXp, getLevelTitle, RedisKeys } from "@tasks-cash/utils";
import { User } from "../models/User";
import { Mission } from "../models/Mission";
import { Transaction } from "../models/Transaction";
import { cacheDel } from "../config/redis";
import { createNotification } from "./notificationService";
import { checkAchievements, grantAchievement } from "./gameService";

export interface MissionCompletionResult {
  coinsEarned: number;
  xpEarned: number;
  newCoins: number;
  newXp: number;
  newLevel: number;
  levelTitle: string;
  leveledUp: boolean;
  missionTitle: string;
}

/** Complete a mission for a user */
export async function completeMission(
  userId: string,
  missionId: string
): Promise<MissionCompletionResult> {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const mission = await Mission.findById(missionId);
  if (!mission || !mission.isActive) throw new Error("Mission not found or inactive");

  if (user.completedMissions.some((id) => id.toString() === missionId)) {
    throw new Error("Mission already completed");
  }

  if (mission.expiresAt && mission.expiresAt < new Date()) {
    throw new Error("Mission has expired");
  }

  if (mission.maxCompletions && mission.currentCompletions >= mission.maxCompletions) {
    throw new Error("Mission completion limit reached");
  }

  const baseXp = Number(process.env.XP_PER_LEVEL ?? 1000);
  const rewards = calculateCompletionRewards(
    mission.coinReward,
    mission.xpReward,
    user.level,
    user.xp,
    mission.difficulty,
    baseXp
  );

  user.coins += rewards.coins;
  user.xp += rewards.xp;
  user.level = rewards.projectedLevel;
  user.currencies = addCurrency(user.currencies ?? { bronze: user.coins, silver: 0, gold: 0, diamonds: 0, crystals: 0, legendTokens: 0, mythicCoins: 0, portalEnergy: 100 }, { bronze: rewards.coins });
  const statResult = addStatXp(user.rpgStats, "global", rewards.xp);
  user.rpgStats = statResult.stats;
  user.rpgStats.strength.xp += Math.floor(rewards.xp * 0.3);
  user.rpgStats.intelligence.xp += Math.floor(rewards.xp * 0.2);
  user.totalXpEarned = (user.totalXpEarned ?? 0) + rewards.xp;
  user.completedMissions.push(new mongoose.Types.ObjectId(missionId));

  mission.currentCompletions += 1;
  await mission.save();

  if (user.completedMissions.length === 1) {
    await grantAchievement(user, "first_mission");
  }
  await checkAchievements(user);
  await user.save();

  await Transaction.create({
    userId: user._id,
    type: "mission_reward",
    amount: rewards.coins,
    description: `Completed mission: ${mission.title}`,
    metadata: { missionId, xpEarned: rewards.xp },
  });

  await cacheDel(RedisKeys.leaderboard("all"));

  await createNotification({
    userId: user._id.toString(),
    type: "mission_complete",
    title: "Mission Complete!",
    message: `You earned ${rewards.coins} coins and ${rewards.xp} XP for "${mission.title}"`,
    metadata: { missionId, coins: rewards.coins, xp: rewards.xp },
  });

  if (rewards.leveledUp) {
    await createNotification({
      userId: user._id.toString(),
      type: "level_up",
      title: "Level Up!",
      message: `You ascended to Level ${rewards.projectedLevel} — ${getLevelTitle(rewards.projectedLevel)}`,
      metadata: { level: rewards.projectedLevel },
    });
  }

  return {
    coinsEarned: rewards.coins,
    xpEarned: rewards.xp,
    newCoins: user.coins,
    newXp: user.xp,
    newLevel: rewards.projectedLevel,
    levelTitle: getLevelTitle(rewards.projectedLevel),
    leveledUp: rewards.leveledUp,
    missionTitle: mission.title,
  };
}
