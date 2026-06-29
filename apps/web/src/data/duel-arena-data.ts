export type DuelStatus = "pending" | "active" | "completed";

export interface DuelEntry {
  id: string;
  playerA: string;
  playerB: string;
  avatarA: string;
  avatarB: string;
  missionType: string;
  scoreA: string;
  scoreB: string;
  timeLeft: string;
  reward: string;
  status: DuelStatus;
}

export const DUEL_TYPES = ["Speed Challenge", "Video Hunter Duel", "Raid Score Duel", "XP Race"];

export const PENDING_DUELS: DuelEntry[] = [
  {
    id: "pd1",
    playerA: "IronCipher",
    playerB: "VoidHunter_X",
    avatarA: "🛡️",
    avatarB: "🎯",
    missionType: "Speed Challenge",
    scoreA: "—",
    scoreB: "—",
    timeLeft: "Awaiting acceptance",
    reward: "150 Gold",
    status: "pending",
  },
];

export const ACTIVE_DUELS: DuelEntry[] = [
  {
    id: "ad1",
    playerA: "Maria",
    playerB: "NovaBlade",
    avatarA: "🗡️",
    avatarB: "⚔️",
    missionType: "Video Hunter Duel",
    scoreA: "12,400",
    scoreB: "11,800",
    timeLeft: "2h 18m",
    reward: "300 Gold",
    status: "active",
  },
  {
    id: "ad2",
    playerA: "Ahmed",
    playerB: "FlashRaid",
    avatarA: "⚔️",
    avatarB: "⚡",
    missionType: "XP Race",
    scoreA: "8,200",
    scoreB: "7,950",
    timeLeft: "45m",
    reward: "200 Gold",
    status: "active",
  },
];

export const DUEL_HISTORY = [
  { id: "h1", winner: "Maria", loser: "John", missionType: "Duel Arena", reward: "+150 Gold", date: "Jun 19, 2026" },
  { id: "h2", winner: "Ahmed", loser: "Omar", missionType: "Speed Challenge", reward: "+200 Gold", date: "Jun 18, 2026" },
  { id: "h3", winner: "Sarah", loser: "FlashRaid", missionType: "Video Hunter Duel", reward: "+100 Gold", date: "Jun 17, 2026" },
];

export const DUEL_CHAMPIONS = [
  { rank: 1, username: "Maria", wins: 24, avatar: "🗡️", title: "Duel Champion" },
  { rank: 2, username: "RaidKing_99", wins: 19, avatar: "⚔️", title: "Warlord" },
  { rank: 3, username: "VoidHunter_X", wins: 12, avatar: "🎯", title: "Elite Duelist" },
  { rank: 4, username: "Ahmed", wins: 11, avatar: "⚔️", title: "Challenger" },
  { rank: 5, username: "Sarah", wins: 10, avatar: "🎥", title: "Hunter" },
  { rank: 6, username: "ShadowVault", wins: 9, avatar: "👑", title: "Legend" },
  { rank: 7, username: "NovaBlade", wins: 8, avatar: "⚔️", title: "Blade" },
  { rank: 8, username: "IronCipher", wins: 7, avatar: "🛡️", title: "Guardian" },
  { rank: 9, username: "Omar", wins: 6, avatar: "🏅", title: "Explorer" },
  { rank: 10, username: "John", wins: 5, avatar: "🔥", title: "Rookie" },
];
