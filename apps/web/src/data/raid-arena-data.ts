export type RaidPhase = "live" | "upcoming" | "past";

export interface RaidEvent {
  id: string;
  name: string;
  phase: RaidPhase;
  players: number;
  maxPlayers: number;
  rewardPool: string;
  startTime: string;
  endTime: string;
  countdownLabel?: string;
  requirements?: string;
  difficulty: string;
}

/** Stable mock end time for live raid countdown (client useEffect only) */
export const LIVE_RAID_COUNTDOWN_END = "2026-06-24T20:14:00.000Z";

export const RAID_RULES = [
  "Must join before the raid start time.",
  "Submissions count only during the live raid window.",
  "Duplicate submissions are rejected.",
  "Admin approval required for reward distribution.",
];

export const RAID_EVENTS: RaidEvent[] = [
  {
    id: "r-live-1",
    name: "Eclipse Vault Raid",
    phase: "live",
    players: 842,
    maxPlayers: 1000,
    rewardPool: "◈ 250,000",
    startTime: "Jun 21, 18:00",
    endTime: "Jun 21, 22:00",
    countdownLabel: "Ends in",
    difficulty: "Hard",
  },
  {
    id: "r-live-2",
    name: "Crystal Gate Mission Event",
    phase: "live",
    players: 412,
    maxPlayers: 600,
    rewardPool: "◈ 120,000",
    startTime: "Jun 21, 16:00",
    endTime: "Jun 21, 20:00",
    countdownLabel: "Ends in",
    difficulty: "Medium",
  },
  {
    id: "r-up1",
    name: "Shadow Gate Timed Challenge",
    phase: "upcoming",
    players: 0,
    maxPlayers: 800,
    rewardPool: "◈ 180,000",
    startTime: "Jun 22, 18:00",
    endTime: "Jun 22, 21:00",
    requirements: "Strength Level 5+ · Join before start",
    difficulty: "Medium",
  },
  {
    id: "r-up2",
    name: "Crystal Fortress Raid",
    phase: "upcoming",
    players: 0,
    maxPlayers: 1200,
    rewardPool: "◈ 420,000",
    startTime: "Jun 24, 12:00",
    endTime: "Jun 24, 16:00",
    requirements: "Complete 3 prior raids",
    difficulty: "Extreme",
  },
  {
    id: "r-past1",
    name: "Void Storm Raid",
    phase: "past",
    players: 956,
    maxPlayers: 1000,
    rewardPool: "◈ 210,000",
    startTime: "Jun 18, 14:00",
    endTime: "Jun 18, 18:00",
    difficulty: "Hard",
  },
  {
    id: "r-past2",
    name: "Golden Portal Event",
    phase: "past",
    players: 712,
    maxPlayers: 800,
    rewardPool: "◈ 150,000",
    startTime: "Jun 15, 12:00",
    endTime: "Jun 15, 16:00",
    difficulty: "Medium",
  },
];

export const RAID_PAST_WINNERS = [
  { rank: 1, username: "RaidKing_99", avatar: "⚔️", score: "98,400", reward: "◈ 12,500" },
  { rank: 2, username: "ShadowVault", avatar: "👑", score: "91,200", reward: "◈ 8,200" },
  { rank: 3, username: "VoidHunter_X", avatar: "🎯", score: "87,600", reward: "◈ 5,400" },
];

export function formatRaidCountdown(endsAt: Date): string {
  const diff = Math.max(0, endsAt.getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
