import type { CurrencyType } from "@tasks-cash/types";

export interface CurrencyHistoryEntry {
  label: string;
  amount: number;
  time: string;
}

export interface ExplorerEntry {
  rank: number;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  rewards: string;
  badge: string;
}

export type ActivityType =
  | "mission_completed"
  | "level_up"
  | "treasure_opened"
  | "reward_claimed"
  | "challenge_joined";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  time: string;
  icon?: string;
}

export interface DashboardChallenge {
  id: string;
  title: string;
  description: string;
  status: "active" | "upcoming" | "ended";
  reward: string;
  rank?: number;
  participants: number;
  endsAt: Date;
}

export const DASHBOARD_CURRENCY_HISTORY: Partial<Record<CurrencyType, CurrencyHistoryEntry[]>> = {
  bronze: [
    { label: "Daily Mission", amount: 50, time: "2h ago" },
    { label: "Challenge Bonus", amount: 120, time: "5h ago" },
  ],
  silver: [
    { label: "Weekly Event", amount: 15, time: "1d ago" },
    { label: "Treasure Open", amount: 8, time: "2d ago" },
  ],
  gold: [
    { label: "Rank Reward", amount: 3, time: "3h ago" },
    { label: "Founder Bonus", amount: 1, time: "1d ago" },
  ],
  diamonds: [
    { label: "Epic Chest", amount: 2, time: "6h ago" },
    { label: "Challenge Win", amount: 5, time: "12h ago" },
  ],
  crystals: [
    { label: "Mystery Mission", amount: 4, time: "4h ago" },
    { label: "Portal Storm", amount: 6, time: "1d ago" },
  ],
};

export const TOP_10_EXPLORERS: ExplorerEntry[] = [
  { rank: 1, username: "VoidKing", avatar: "VK", level: 42, xp: 98500, rewards: "◈ 12.4K", badge: "Legend" },
  { rank: 2, username: "NovaBlade", avatar: "NB", level: 38, xp: 87200, rewards: "◈ 9.8K", badge: "Mythic" },
  { rank: 3, username: "GoldWarden", avatar: "GW", level: 35, xp: 76100, rewards: "◈ 8.9K", badge: "Diamond" },
  { rank: 4, username: "PortalMage", avatar: "PM", level: 31, xp: 65400, rewards: "◈ 7.2K", badge: "Gold" },
  { rank: 5, username: "StarRunner", avatar: "SR", level: 28, xp: 58900, rewards: "◈ 6.1K", badge: "Gold" },
  { rank: 6, username: "CrystalFox", avatar: "CF", level: 26, xp: 51200, rewards: "◈ 5.4K", badge: "Silver" },
  { rank: 7, username: "ShadowHunter", avatar: "SH", level: 24, xp: 47800, rewards: "◈ 4.9K", badge: "Silver" },
  { rank: 8, username: "QuantumDrift", avatar: "QD", level: 22, xp: 42100, rewards: "◈ 4.2K", badge: "Bronze" },
  { rank: 9, username: "NeonSage", avatar: "NS", level: 20, xp: 38500, rewards: "◈ 3.8K", badge: "Bronze" },
  { rank: 10, username: "AetherKnight", avatar: "AK", level: 19, xp: 35200, rewards: "◈ 3.5K", badge: "Bronze" },
];

export const PLAYER_ACTIVITY: ActivityEntry[] = [
  { id: "a1", type: "mission_completed", title: "Mission Completed", detail: "Portal Scout Run — +150 Bronze", time: "12m ago" },
  { id: "a2", type: "level_up", title: "Level Upgraded", detail: "Strength reached Level 4", time: "1h ago" },
  { id: "a3", type: "treasure_opened", title: "Treasure Opened", detail: "Epic Chest — 3 Diamond Gems", time: "3h ago" },
  { id: "a4", type: "reward_claimed", title: "Reward Claimed", detail: "Daily Mystery Reward — +25 Gold", time: "5h ago" },
  { id: "a5", type: "challenge_joined", title: "Challenge Joined", detail: "7-Day Streak Arena", time: "8h ago" },
  { id: "a6", type: "mission_completed", title: "Mission Completed", detail: "Void Nexus Explorer — +500 XP", time: "1d ago" },
];

export const DASHBOARD_CHALLENGES: DashboardChallenge[] = [
  {
    id: "c1",
    title: "7-Day Streak Arena",
    description: "Maintain a daily login streak for 7 consecutive days.",
    status: "active",
    reward: "500 XP + Legend Badge",
    rank: 42,
    participants: 8420,
    endsAt: new Date("2026-06-26T12:00:00.000Z"),
  },
  {
    id: "c2",
    title: "Coin Rush Weekend",
    description: "Earn the most bronze coins in 48 hours.",
    status: "active",
    reward: "2x Coin Multiplier",
    rank: 128,
    participants: 12050,
    endsAt: new Date("2026-06-24T04:00:00.000Z"),
  },
  {
    id: "c3",
    title: "Portal Sprint",
    description: "Complete 10 missions before the timer expires.",
    status: "active",
    reward: "Legendary Chest",
    rank: 67,
    participants: 3100,
    endsAt: new Date("2026-06-28T08:00:00.000Z"),
  },
  {
    id: "c4",
    title: "Dimension Siege",
    description: "Team challenge — conquer the weekly boss.",
    status: "upcoming",
    reward: "Mythic Coins + 1000 XP",
    participants: 0,
    endsAt: new Date("2026-06-30T00:00:00.000Z"),
  },
];

export function formatCountdown(end: Date): string {
  const diff = Math.max(0, end.getTime() - Date.now());
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  return `${h}h ${m}m ${s}s`;
}
