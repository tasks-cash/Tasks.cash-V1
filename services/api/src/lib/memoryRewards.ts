import type { IUserDocument } from "../models/User";

export type MemoryRewardView = {
  _id: string;
  name: string;
  description: string;
  type: "coins" | "xp" | "badge";
  rarity: "common" | "rare" | "epic" | "legendary";
  value: number;
  requiredLevel: number;
  requiredCoins?: number;
  isActive: boolean;
  unlocked: boolean;
  owned: boolean;
  status: "available" | "pending" | "claimed";
  amountLabel: string;
};

const BASE_REWARDS: Omit<MemoryRewardView, "unlocked" | "owned" | "status">[] = [
  {
    _id: "mem_rw_daily",
    name: "Daily Login Streak",
    description: "Claim your daily login bonus",
    type: "coins",
    rarity: "common",
    value: 50,
    requiredLevel: 1,
    isActive: true,
    amountLabel: "50 coins",
  },
  {
    _id: "mem_rw_weekly",
    name: "Weekly Challenge",
    description: "Weekly challenge completion bonus",
    type: "xp",
    rarity: "rare",
    value: 500,
    requiredLevel: 5,
    isActive: true,
    amountLabel: "500 XP",
  },
  {
    _id: "mem_rw_referral",
    name: "Referral Bonus",
    description: "Bonus from successful referral",
    type: "coins",
    rarity: "epic",
    value: 100,
    requiredLevel: 1,
    isActive: true,
    amountLabel: "100 coins",
  },
  {
    _id: "mem_rw_treasure",
    name: "Treasure Chest",
    description: "Open a random loot chest",
    type: "badge",
    rarity: "legendary",
    value: 1,
    requiredLevel: 10,
    requiredCoins: 250,
    isActive: true,
    amountLabel: "Random loot",
  },
];

const claimed = new Set<string>();

export function getMemoryRewards(user: IUserDocument): MemoryRewardView[] {
  return BASE_REWARDS.map((reward) => {
    const owned = claimed.has(reward._id) || user.badges.includes(reward.name);
    const unlocked = user.level >= reward.requiredLevel && user.coins >= (reward.requiredCoins ?? 0);
    const status = owned ? "claimed" : unlocked ? "available" : "pending";
    return { ...reward, unlocked, owned, status };
  });
}

export function claimMemoryReward(_userId: string, rewardId: string) {
  const reward = BASE_REWARDS.find((r) => r._id === rewardId);
  if (!reward) return { error: "Reward not found" as const };
  if (claimed.has(rewardId)) return { error: "Reward already claimed" as const };
  claimed.add(rewardId);
  return {
    reward: { ...reward, status: "claimed" as const },
    message: `Claimed ${reward.name}`,
  };
}

export function getMemoryRewardsFallback() {
  return BASE_REWARDS.map((reward) => ({
    ...reward,
    unlocked: reward._id !== "mem_rw_treasure",
    owned: reward._id === "mem_rw_referral",
    status: reward._id === "mem_rw_referral" ? "claimed" as const : reward._id === "mem_rw_treasure" ? "available" as const : "pending" as const,
  }));
}
