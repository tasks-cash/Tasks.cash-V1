import type {
  ActivityKind,
  ChallengesArenaData,
  WinnerCategoryId,
  WinnerEntry,
  WinnerPeriod,
} from "@/types/challenges-arena";

const WINNER_NAMES = [
  { avatar: "👑", username: "ShadowVault", title: "Legend" },
  { avatar: "⚔️", username: "RaidKing_99", title: "Raid Commander" },
  { avatar: "🎯", username: "VoidHunter_X", title: "Elite Hunter" },
  { avatar: "🔮", username: "MysticPulse", title: "Vault Keeper" },
  { avatar: "🌌", username: "NebulaStrike", title: "Champion" },
  { avatar: "💎", username: "GemRunner", title: "Hunter" },
  { avatar: "🛡️", username: "IronCipher", title: "Guardian" },
  { avatar: "⚡", username: "FlashRaid", title: "Explorer" },
];

function buildWinners(category: string, seed: number): WinnerEntry[] {
  return [1, 2, 3, 4, 5].map((rank) => {
    const p = WINNER_NAMES[(seed + rank) % WINNER_NAMES.length];
    const rewards = ["500 Gold", "250 Gold", "100 Gold", "50 Silver", "25 Bronze"];
    const badges = ["Season Champion", "Raid Hero", "Top 10", "Mystery Solver", "Early Explorer"];
    return {
      rank,
      avatar: p.avatar,
      username: p.username,
      title: p.title,
      level: 30 - rank * 2 + seed,
      category,
      reward: rewards[rank - 1],
      badge: badges[rank - 1],
    };
  });
}

const CATEGORY_META: { id: WinnerCategoryId; label: string; icon: string }[] = [
  { id: "highest_xp", label: "Highest XP", icon: "✨" },
  { id: "most_videos", label: "Most Approved Videos", icon: "🎥" },
  { id: "most_referrals", label: "Most Referral Wins", icon: "🤝" },
  { id: "most_raids", label: "Most Raid Wins", icon: "⚔️" },
  { id: "most_duels", label: "Most Duel Wins", icon: "🗡️" },
  { id: "highest_strength", label: "Highest Strength Level", icon: "💪" },
  { id: "highest_life", label: "Highest Life Level", icon: "❤️" },
  { id: "highest_speed", label: "Highest Speed Level", icon: "⚡" },
  { id: "highest_intelligence", label: "Highest Intelligence Level", icon: "🧠" },
  { id: "highest_general", label: "Highest General Level", icon: "🏆" },
];

function buildPeriodWinners(periodSeed: number): Record<WinnerCategoryId, WinnerEntry[]> {
  return CATEGORY_META.reduce(
    (acc, cat, i) => {
      acc[cat.id] = buildWinners(cat.label, periodSeed + i);
      return acc;
    },
    {} as Record<WinnerCategoryId, WinnerEntry[]>
  );
}

const PERIODS: WinnerPeriod[] = ["daily", "weekly", "monthly", "season", "all_time"];

export const WINNER_PERIOD_TABS: { id: WinnerPeriod; label: string }[] = [
  { id: "daily", label: "Daily Winners" },
  { id: "weekly", label: "Weekly Winners" },
  { id: "monthly", label: "Monthly Winners" },
  { id: "season", label: "Season Winners" },
  { id: "all_time", label: "All-Time Champions" },
];

export const ACTIVITY_VERBS: Record<ActivityKind, string> = {
  win: "won",
  level_up: "reached",
  mission_complete: "completed",
  badge_unlock: "unlocked",
};

export const CHALLENGES_ARENA: ChallengesArenaData = {
  overview: {
    activeChallenges: 24,
    currentRewardPool: "◈ 3,850,000",
    activePlayers: 1842,
    nextChallengeCountdown: "",
    todaysWinners: 47,
    seasonProgress: 62,
    seasonLabel: "Season IV — Eclipse Vault",
  },
  nextChallengeEndsAt: "2026-06-24T18:00:00.000Z",
  gameModes: [
    {
      id: "video-hunter",
      name: "Video Hunter",
      icon: "🎥",
      description: "Submit public videos with 10K+ views and earn rewards after approval.",
      activeCount: 156,
      rewardType: "Gold Coins + XP",
      difficulty: "medium",
      status: "live",
      glow: "gold",
    },
    {
      id: "raid-arena",
      name: "Raid Arena",
      icon: "⚔️",
      description: "Join timed group challenges and compete against all players during live events.",
      activeCount: 89,
      rewardType: "Raid Chest + Badges",
      difficulty: "hard",
      status: "live",
      glow: "violet",
    },
    {
      id: "duel-arena",
      name: "Duel Arena",
      icon: "🗡️",
      description: "Challenge another player 1v1 and win rewards based on performance.",
      activeCount: 34,
      rewardType: "Duel Tokens + Strength XP",
      difficulty: "hard",
      status: "live",
      glow: "purple",
    },
    {
      id: "hard-missions",
      name: "Hard Missions",
      icon: "🔥",
      description: "Complete difficult missions with higher rewards and special badges.",
      activeCount: 12,
      rewardType: "Legend Tokens + Titles",
      difficulty: "extreme",
      status: "live",
      glow: "gold",
    },
  ],
  winnerCategories: CATEGORY_META,
  winnersByPeriod: PERIODS.reduce(
    (acc, period, i) => {
      acc[period] = buildPeriodWinners(i * 3);
      return acc;
    },
    {} as ChallengesArenaData["winnersByPeriod"]
  ),
  hardMissions: [
    {
      id: "hm-emails",
      title: "Create 100 Emails",
      description: "Build a verified list of 100 unique email contacts for research outreach.",
      difficulty: "hard",
      estimatedTime: "5–7 days",
      requiredProof: "CSV upload + verification screenshot",
      rewardPreview: "500 Gold + Research Badge",
      deadline: "Jul 15, 2026",
      progress: 0,
      status: "available",
      glow: "purple",
    },
    {
      id: "hm-videos",
      title: "Submit 50 Valid Video Links",
      description: "Submit 50 approved public video links meeting platform quality standards.",
      difficulty: "extreme",
      estimatedTime: "14 days",
      requiredProof: "Video link batch submission",
      rewardPreview: "1,200 Gold + Video Master Badge",
      deadline: "Jul 30, 2026",
      progress: 34,
      status: "in_progress",
      glow: "gold",
    },
    {
      id: "hm-referrals",
      title: "Invite 25 Active Users",
      description: "Successfully invite 25 users who complete their first mission.",
      difficulty: "hard",
      estimatedTime: "10 days",
      requiredProof: "Referral dashboard export",
      rewardPreview: "800 Gold + Referral King Title",
      deadline: "Aug 1, 2026",
      progress: 18,
      status: "in_progress",
      glow: "violet",
    },
    {
      id: "hm-raids",
      title: "Complete 10 Raids",
      description: "Participate and complete 10 successful raid events during live windows.",
      difficulty: "hard",
      estimatedTime: "7 days",
      requiredProof: "Raid completion log",
      rewardPreview: "600 Gold + Raid Hero Badge",
      deadline: "Jun 28, 2026",
      progress: 7,
      status: "under_review",
      glow: "purple",
    },
    {
      id: "hm-duels",
      title: "Win 5 Duels",
      description: "Win 5 ranked duels against active arena players.",
      difficulty: "hard",
      estimatedTime: "5 days",
      requiredProof: "Duel match history",
      rewardPreview: "400 Gold + Duel Champion Badge",
      deadline: "Jun 25, 2026",
      progress: 100,
      status: "completed",
      glow: "gold",
    },
    {
      id: "hm-identity",
      title: "Complete Identity Profile",
      description: "Finish all identity verification steps and profile challenges.",
      difficulty: "medium",
      estimatedTime: "2 days",
      requiredProof: "Identity verification status",
      rewardPreview: "300 XP + Identity Badge",
      deadline: "Jun 30, 2026",
      progress: 85,
      status: "in_progress",
      glow: "violet",
    },
    {
      id: "hm-research",
      title: "Submit Research List",
      description: "Deliver a curated research list meeting portal quality criteria.",
      difficulty: "hard",
      estimatedTime: "4 days",
      requiredProof: "Research document upload",
      rewardPreview: "450 Gold + Intelligence XP",
      deadline: "Jul 5, 2026",
      progress: 0,
      status: "available",
      glow: "purple",
    },
    {
      id: "hm-streak",
      title: "Finish a 7-Day Streak",
      description: "Log in and complete at least one daily objective for 7 consecutive days.",
      difficulty: "medium",
      estimatedTime: "7 days",
      requiredProof: "Streak tracker snapshot",
      rewardPreview: "200 Gold + Life Level Boost",
      deadline: "Jun 22, 2026",
      progress: 100,
      status: "expired",
      glow: "violet",
    },
  ],
  levelChampions: [
    { id: "life", attribute: "Life Level Champion", icon: "❤️", username: "DailyForge", level: 18, progress: 92, badge: "Streak Master", reward: "Streak Shield" },
    { id: "speed", attribute: "Speed Level Champion", icon: "⚡", username: "FlashRaid", level: 16, progress: 88, badge: "Lightning Runner", reward: "+2 Raid Slots" },
    { id: "strength", attribute: "Strength Level Champion", icon: "⚔️", username: "RaidKing_99", level: 19, progress: 95, badge: "Warlord", reward: "500 Gold" },
    { id: "intelligence", attribute: "Intelligence Level Champion", icon: "🧠", username: "MysticPulse", level: 17, progress: 90, badge: "Mystery Solver", reward: "Vault Key" },
    { id: "hunter", attribute: "Hunter Level Champion", icon: "🎥", username: "VoidHunter_X", level: 15, progress: 86, badge: "Video Master", reward: "Elite Hunter Title" },
    { id: "referral", attribute: "Referral Level Champion", icon: "🤝", username: "NetworkLord", level: 14, progress: 82, badge: "Referral King", reward: "1,000 Gold" },
    { id: "victory", attribute: "Victory Level Champion", icon: "🏆", username: "ShadowVault", level: 20, progress: 97, badge: "Season Champion", reward: "Legend Token" },
    { id: "explorer", attribute: "Explorer Level Champion", icon: "🗺", username: "NebulaStrike", level: 16, progress: 84, badge: "Vault Keeper", reward: "Hidden Mission Unlock" },
    { id: "wealth", attribute: "Wealth Level Champion", icon: "💰", username: "GemRunner", level: 22, progress: 99, badge: "Treasure Baron", reward: "50 Diamond Gems" },
    { id: "general", attribute: "General Level Champion", icon: "✨", username: "ShadowVault", level: 31, progress: 78, badge: "Immortal Path", reward: "Mythic Title" },
  ],
  rewardPools: [
    {
      period: "daily",
      label: "Daily Reward Pool",
      totalValue: "◈ 125,000",
      currencies: [
        { type: "Bronze Coins", icon: "🥉", amount: "85,000" },
        { type: "Silver Coins", icon: "🥈", amount: "28,000" },
        { type: "Gold Coins", icon: "🥇", amount: "8,500" },
        { type: "XP", icon: "✨", amount: "50,000" },
      ],
    },
    {
      period: "weekly",
      label: "Weekly Reward Pool",
      totalValue: "◈ 580,000",
      currencies: [
        { type: "Silver Coins", icon: "🥈", amount: "320,000" },
        { type: "Gold Coins", icon: "🥇", amount: "180,000" },
        { type: "Diamond Gems", icon: "💎", amount: "2,400" },
        { type: "Badges", icon: "🏅", amount: "120" },
        { type: "XP", icon: "✨", amount: "200,000" },
      ],
    },
    {
      period: "monthly",
      label: "Monthly Reward Pool",
      totalValue: "◈ 1,850,000",
      currencies: [
        { type: "Gold Coins", icon: "🥇", amount: "980,000" },
        { type: "Diamond Gems", icon: "💎", amount: "8,500" },
        { type: "Legend Tokens", icon: "🌟", amount: "450" },
        { type: "Titles", icon: "👑", amount: "25" },
        { type: "XP", icon: "✨", amount: "750,000" },
      ],
    },
    {
      period: "seasonal",
      label: "Seasonal Reward Pool",
      totalValue: "◈ 5,200,000",
      currencies: [
        { type: "Gold Coins", icon: "🥇", amount: "2,400,000" },
        { type: "Diamond Gems", icon: "💎", amount: "25,000" },
        { type: "Legend Tokens", icon: "🌟", amount: "2,800" },
        { type: "Titles", icon: "👑", amount: "100" },
        { type: "Badges", icon: "🏅", amount: "500" },
        { type: "XP", icon: "✨", amount: "2,000,000" },
      ],
    },
  ],
  recentWins: [
    {
      id: "rw-sarah-video",
      avatar: "🎥",
      username: "Sarah",
      activityKind: "win",
      activity: "Daily Video Hunter",
      reward: "+250 Gold",
      timeAgo: "2m ago",
      highlight: true,
    },
    {
      id: "rw-ahmed-strength",
      avatar: "⚔️",
      username: "Ahmed",
      activityKind: "level_up",
      activity: "Strength Level 12",
      reward: "+10% Raid Damage",
      timeAgo: "14m ago",
    },
    {
      id: "rw-john-hard-mission",
      avatar: "🔥",
      username: "John",
      activityKind: "mission_complete",
      activity: "Hard Mission",
      reward: "+1,200 Gold",
      timeAgo: "28m ago",
    },
    {
      id: "rw-maria-duel",
      avatar: "🗡️",
      username: "Maria",
      activityKind: "win",
      activity: "Duel Arena",
      reward: "+150 Gold",
      timeAgo: "45m ago",
    },
    {
      id: "rw-omar-badge",
      avatar: "🏅",
      username: "Omar",
      activityKind: "badge_unlock",
      activity: "Season Badge",
      reward: "Season Champion",
      timeAgo: "1h ago",
      highlight: true,
    },
  ],
};

export function formatCountdown(endsAt: Date): string {
  const diff = Math.max(0, endsAt.getTime() - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  available: { label: "Available", className: "border-emerald-400/40 bg-emerald-950/40 text-emerald-300" },
  in_progress: { label: "In Progress", className: "border-amber-400/40 bg-amber-950/40 text-amber-300" },
  under_review: { label: "Under Review", className: "border-cyan-400/40 bg-cyan-950/40 text-cyan-300" },
  completed: { label: "Completed", className: "border-purple-400/40 bg-purple-950/40 text-purple-300" },
  expired: { label: "Expired", className: "border-red-400/30 bg-red-950/30 text-red-300/70" },
  live: { label: "Live", className: "border-emerald-400/40 bg-emerald-950/40 text-emerald-300" },
  upcoming: { label: "Upcoming", className: "border-amber-400/40 bg-amber-950/40 text-amber-300" },
  maintenance: { label: "Maintenance", className: "border-red-400/30 bg-red-950/30 text-red-300/70" },
};

export const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-orange-400",
  extreme: "text-red-400",
};

export const RANK_STYLES: Record<number, { border: string; glow: string; label: string }> = {
  1: { border: "border-amber-400/60", glow: "shadow-[0_0_40px_rgba(212,175,55,0.35)]", label: "text-amber-400" },
  2: { border: "border-slate-300/50", glow: "shadow-[0_0_30px_rgba(192,192,192,0.25)]", label: "text-slate-300" },
  3: { border: "border-orange-600/50", glow: "shadow-[0_0_25px_rgba(205,127,50,0.3)]", label: "text-orange-400" },
};
