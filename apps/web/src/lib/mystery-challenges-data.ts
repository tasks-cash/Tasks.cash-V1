import type { IMysteryMissionView } from "@tasks-cash/types";
import { MYSTERY_MODE_MISSIONS } from "./mystery-mode-data";
import { TOP_10_EXPLORERS, formatCountdown } from "./dashboard-mock-data";

export { TOP_10_EXPLORERS, formatCountdown };

export const MYSTERY_CHALLENGE_STATS = {
  activeChallenges: 12,
  totalRewardsAvailable: "◈ 2,450,000",
  completedMissions: 847,
  withdrawalsCompleted: 1240,
} as const;

export const FEATURED_CHALLENGE = {
  id: "first-trial",
  title: "First Trial: Prove Your Reach",
  requirement: "Submit a video with 10K+ views + complete profile",
  reward: "XP + coins + commission after approval",
  xp: 1000,
  coins: 500,
  status: "active" as const,
};

export const MYSTERY_CHALLENGE_MISSIONS: IMysteryMissionView[] = MYSTERY_MODE_MISSIONS;

export const REWARD_POOL = [
  {
    id: "bronze",
    name: "Bronze Coins",
    amount: "125,400",
    icon: "🥉",
    glow: "purple" as const,
  },
  {
    id: "silver",
    name: "Silver Coins",
    amount: "18,750",
    icon: "🥈",
    glow: "violet" as const,
  },
  {
    id: "gold",
    name: "Gold Coins",
    amount: "4,820",
    icon: "🥇",
    glow: "gold" as const,
  },
  {
    id: "diamond",
    name: "Diamond Gems",
    amount: "892",
    icon: "💎",
    glow: "gold" as const,
  },
] as const;

/** Next challenge unlock — stable mock timestamp (avoid Date.now() at module load) */
export const NEXT_CHALLENGE_UNLOCK = new Date("2026-06-24T12:00:00.000Z");
