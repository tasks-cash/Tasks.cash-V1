import type {
  ICurrencies,
  ILiveReward,
  IPlayerProfile,
  IGameDashboard,
  RPGStatType,
} from "@tasks-cash/types";
import {
  addCurrency,
  addStatXp,
  buildRPGProgress,
  getExplorerRank,
  rollLiveReward,
  rollChestLoot,
  getChestById,
  getAchievementById,
  getBadgeById,
  ACHIEVEMENTS,
  BADGES,
  TREASURE_CHESTS,
  GAME_EVENTS,
  statProgress,
  xpProgress,
  getLevelTitle,
} from "@tasks-cash/utils";
import { IUserDocument, User } from "../models/User";
import { Referral } from "../models/Referral";
import { createNotification } from "./notificationService";

const LIVE_REWARD_COOLDOWN_MS = 45_000;

function syncLegacyCoins(user: IUserDocument): void {
  user.coins = user.currencies?.bronze ?? user.coins;
  const globalProgress = statProgress(user.rpgStats?.global ?? { level: 1, xp: user.xp });
  user.xp = user.rpgStats?.global?.xp ?? user.xp;
  user.level = globalProgress.level;
  user.explorerRank = getExplorerRank(globalProgress.level);
  user.playerTitle = getLevelTitle(globalProgress.level);
}

export async function buildPlayerProfile(user: IUserDocument): Promise<IPlayerProfile> {
  syncLegacyCoins(user);
  const referralCount = await Referral.countDocuments({ referrerId: user._id });
  const rank = (await User.countDocuments({ xp: { $gt: user.xp } })) + 1;
  const rpgStats = buildRPGProgress(user.rpgStats);
  const dailyRewardAvailable = !user.lastDailyClaim ||
    Date.now() - new Date(user.lastDailyClaim).getTime() > 86400000;

  return {
    userId: user._id.toString(),
    username: user.username,
    avatar: user.avatar,
    avatarFrame: user.avatarFrame,
    playerTitle: user.playerTitle,
    explorerRank: user.explorerRank,
    globalLevel: rpgStats.global.level,
    globalXp: user.rpgStats.global.xp,
    currencies: user.currencies,
    rpgStats,
    achievements: user.achievements.map((a) => ({ id: a.id, unlockedAt: a.unlockedAt.toISOString() })),
    badges: user.collectedBadges.map((b) => ({ id: b.id, earnedAt: b.earnedAt.toISOString() })),
    statistics: {
      missionsCompleted: user.completedMissions.length,
      treasuresOpened: user.treasuresOpened,
      achievementsUnlocked: user.achievements.length,
      badgesCollected: user.collectedBadges.length,
      totalXpEarned: user.totalXpEarned,
      playTimeMinutes: user.playTimeMinutes,
      globalRank: rank,
    },
    streakDays: user.streakDays,
    dailyRewardAvailable,
  };
}

export async function getGameDashboard(user: IUserDocument): Promise<IGameDashboard> {
  const profile = await buildPlayerProfile(user);
  const globalLevel = profile.globalLevel;
  return {
    ...profile,
    activeEvents: GAME_EVENTS.filter((e) => e.isActive),
    availableChests: TREASURE_CHESTS.filter((c) => c.requiredLevel <= globalLevel),
    recentRewards: [],
  };
}

export async function claimLiveReward(user: IUserDocument): Promise<{ reward: ILiveReward | null; profile: IPlayerProfile }> {
  const now = Date.now();
  if (user.lastLiveReward && now - new Date(user.lastLiveReward).getTime() < LIVE_REWARD_COOLDOWN_MS) {
    return { reward: null, profile: await buildPlayerProfile(user) };
  }

  const reward = rollLiveReward();
  await applyLiveReward(user, reward);
  user.lastLiveReward = new Date();
  await user.save();

  return { reward, profile: await buildPlayerProfile(user) };
}

export async function applyLiveReward(user: IUserDocument, reward: ILiveReward): Promise<void> {
  if (reward.xp || reward.statXp) {
    const stat: RPGStatType = reward.stat ?? "global";
    const gain = reward.statXp ?? reward.xp ?? 0;
    const result = addStatXp(user.rpgStats, stat, gain);
    user.rpgStats = result.stats;
    user.totalXpEarned += gain;
    if (result.leveledUp) {
      await createNotification({
        userId: user._id.toString(),
        type: "stat_level_up",
        title: "Stat Level Up!",
        message: `${stat} reached level ${result.newLevel}`,
        metadata: { stat, level: result.newLevel },
      });
    }
  }
  if (reward.currency) {
    user.currencies = addCurrency(user.currencies, reward.currency);
  }
  syncLegacyCoins(user);
  await checkAchievements(user);
  await createNotification({
    userId: user._id.toString(),
    type: "live_reward",
    title: reward.title,
    message: reward.message,
    metadata: { rewardId: reward.id },
  });
}

export async function claimDailyReward(user: IUserDocument): Promise<IPlayerProfile> {
  const dailyAvailable = !user.lastDailyClaim ||
    Date.now() - new Date(user.lastDailyClaim).getTime() > 86400000;
  if (!dailyAvailable) return buildPlayerProfile(user);

  const baseBonus = 25 + user.streakDays * 5;
  user.currencies = addCurrency(user.currencies, {
    bronze: baseBonus,
    portalEnergy: 15,
    silver: user.streakDays >= 7 ? 5 : 0,
  });
  user.streakDays += 1;
  user.lastDailyClaim = new Date();
  const xpGain = 20 + user.streakDays * 2;
  const result = addStatXp(user.rpgStats, "global", xpGain);
  user.rpgStats = result.stats;
  user.totalXpEarned += xpGain;
  syncLegacyCoins(user);
  await checkAchievements(user);
  await user.save();
  await createNotification({
    userId: user._id.toString(),
    type: "reward_claimed",
    title: "Daily Reward Claimed",
    message: `+${baseBonus} bronze, +${xpGain} XP`,
  });
  return buildPlayerProfile(user);
}

export async function openTreasureChest(user: IUserDocument, chestId: string): Promise<{ loot: Record<string, unknown>; profile: IPlayerProfile }> {
  const chest = getChestById(chestId);
  if (!chest) throw new Error("Chest not found");
  const globalLevel = statProgress(user.rpgStats.global).level;
  if (globalLevel < chest.requiredLevel) throw new Error(`Requires level ${chest.requiredLevel}`);

  if (chest.cost) {
    for (const [key, val] of Object.entries(chest.cost)) {
      const k = key as keyof ICurrencies;
      if ((user.currencies[k] ?? 0) < (val ?? 0)) throw new Error(`Insufficient ${key}`);
    }
    for (const [key, val] of Object.entries(chest.cost)) {
      const k = key as keyof ICurrencies;
      user.currencies[k] -= val ?? 0;
    }
  }

  const lootEntry = rollChestLoot(chest);
  const loot: Record<string, unknown> = { chestId, chestType: chest.type };

  if (lootEntry.xp) {
    const result = addStatXp(user.rpgStats, "global", lootEntry.xp);
    user.rpgStats = result.stats;
    user.totalXpEarned += lootEntry.xp;
    loot.xp = lootEntry.xp;
  }
  if (lootEntry.currency) {
    user.currencies = addCurrency(user.currencies, lootEntry.currency);
    loot.currency = lootEntry.currency;
  }
  if (lootEntry.badgeId) {
    await grantBadge(user, lootEntry.badgeId);
    loot.badgeId = lootEntry.badgeId;
  }
  if (lootEntry.achievementId) {
    await grantAchievement(user, lootEntry.achievementId);
    loot.achievementId = lootEntry.achievementId;
  }

  user.treasuresOpened += 1;
  syncLegacyCoins(user);
  await checkAchievements(user);
  await user.save();
  await createNotification({
    userId: user._id.toString(),
    type: "treasure_found",
    title: `${chest.name} Opened!`,
    message: "You discovered portal loot",
    metadata: loot,
  });

  return { loot, profile: await buildPlayerProfile(user) };
}

export async function exchangeCurrency(
  user: IUserDocument,
  from: keyof ICurrencies,
  to: keyof ICurrencies,
  amount: number
): Promise<IPlayerProfile> {
  const { CURRENCY_META } = await import("@tasks-cash/utils");
  if (from === "portalEnergy" || to === "portalEnergy") throw new Error("Portal energy cannot be exchanged");
  if (user.currencies[from] < amount) throw new Error("Insufficient balance");

  const fromRate = CURRENCY_META[from].exchangeRate;
  const toRate = CURRENCY_META[to].exchangeRate;
  const converted = Math.floor((amount * fromRate) / toRate);
  if (converted <= 0) throw new Error("Amount too small to exchange");

  user.currencies[from] -= amount;
  user.currencies[to] += converted;
  syncLegacyCoins(user);
  await user.save();
  return buildPlayerProfile(user);
}

export async function grantBadge(user: IUserDocument, badgeId: string): Promise<boolean> {
  if (user.collectedBadges.some((b) => b.id === badgeId)) return false;
  const badge = getBadgeById(badgeId);
  if (!badge) return false;
  user.collectedBadges.push({ id: badgeId, earnedAt: new Date() });
  if (!user.badges.includes(badgeId)) user.badges.push(badgeId);
  await createNotification({
    userId: user._id.toString(),
    type: "badge_earned",
    title: "Badge Earned!",
    message: badge.name,
    metadata: { badgeId },
  });
  return true;
}

export async function grantAchievement(user: IUserDocument, achievementId: string): Promise<boolean> {
  if (user.achievements.some((a) => a.id === achievementId)) return false;
  const achievement = getAchievementById(achievementId);
  if (!achievement) return false;
  user.achievements.push({ id: achievementId, unlockedAt: new Date() });
  if (achievement.rewardXp) {
    const result = addStatXp(user.rpgStats, "global", achievement.rewardXp);
    user.rpgStats = result.stats;
    user.totalXpEarned += achievement.rewardXp;
  }
  if (achievement.rewardCurrency) {
    user.currencies = addCurrency(user.currencies, achievement.rewardCurrency);
  }
  if (achievement.badgeId) await grantBadge(user, achievement.badgeId);
  syncLegacyCoins(user);
  await createNotification({
    userId: user._id.toString(),
    type: "achievement_unlocked",
    title: "Achievement Unlocked!",
    message: achievement.name,
    metadata: { achievementId },
  });
  return true;
}

export async function checkAchievements(user: IUserDocument): Promise<void> {
  const referralCount = await Referral.countDocuments({ referrerId: user._id });
  const globalLevel = statProgress(user.rpgStats.global).level;

  for (const achievement of ACHIEVEMENTS) {
    if (user.achievements.some((a) => a.id === achievement.id)) continue;
    let unlocked = false;
    if (achievement.id === "first_login") unlocked = true;
    if (achievement.requiredMissions && user.completedMissions.length >= achievement.requiredMissions) unlocked = true;
    if (achievement.requiredLevel && globalLevel >= achievement.requiredLevel) unlocked = true;
    if (achievement.requiredReferrals && referralCount >= achievement.requiredReferrals) unlocked = true;
    if (achievement.id === "treasure_hunter" && user.treasuresOpened >= 10) unlocked = true;
    if (achievement.id === "explorer" && statProgress(user.rpgStats.reputation).level >= 5) unlocked = true;
    if (unlocked) await grantAchievement(user, achievement.id);
  }
}

export async function onFirstLogin(user: IUserDocument): Promise<void> {
  if (user.achievements.some((a) => a.id === "first_login")) return;
  await grantAchievement(user, "first_login");
  await user.save();
}

export function getAchievementCatalog() {
  return ACHIEVEMENTS;
}

export function getBadgeCatalog() {
  return BADGES;
}

export function getTreasureCatalog() {
  return TREASURE_CHESTS;
}

export function getEventCatalog() {
  return GAME_EVENTS;
}
