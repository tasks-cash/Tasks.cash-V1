/** Static mock data — no runtime randomness for hydration safety */

export const HERO_STATS = [
  { label: "Active Raids", value: "12", icon: "⚔️", glow: "violet" as const },
  { label: "Daily Prize Pool", value: "◈ 48,500", icon: "💎", glow: "gold" as const },
  { label: "Approved Links Today", value: "2,847", icon: "🔗", glow: "violet" as const },
  { label: "Top Explorers", value: "18,420", icon: "🏆", glow: "gold" as const },
];

export const GAME_MODES = [
  {
    id: "video-hunter",
    title: "Video Hunter",
    subtitle: "Viral link raids",
    description: "Submit high-performing video links. Hunt 10K+ view content across platforms and climb timed raid leaderboards.",
    icon: "🎬",
    accent: "from-violet-600/30 to-purple-950/80",
    border: "border-violet-500/40",
    cta: "Enter Video Hunter",
  },
  {
    id: "referral-arena",
    title: "Referral Arena",
    subtitle: "Recruit & dominate",
    description: "Invite allies into the portal. Daily, weekly, and monthly referral champions earn massive coin pools.",
    icon: "🔗",
    accent: "from-amber-600/20 to-purple-950/80",
    border: "border-amber-400/35",
    cta: "Enter Referral Arena",
  },
  {
    id: "identity-challenge",
    title: "Identity Challenge",
    subtitle: "Secret verification",
    description: "Answer encrypted identity questions. Prove you belong to the inner circle of portal explorers.",
    icon: "🎭",
    accent: "from-purple-600/30 to-black/80",
    border: "border-purple-400/40",
    cta: "Begin Identity Trial",
  },
  {
    id: "special-missions",
    title: "Special Missions",
    subtitle: "Manual elite tasks",
    description: "Complete custom research, campaigns, and data collection missions assigned by portal command.",
    icon: "📜",
    accent: "from-indigo-600/25 to-black/80",
    border: "border-indigo-400/30",
    cta: "View Special Missions",
  },
];

export const VIDEO_RAIDS = {
  permanent: {
    title: "Submit 10K+ Video Links",
    reward: "◈ 500 per approved link",
    progress: 68,
    submitted: 342,
    target: 500,
  },
  timed: [
    { id: "r1", name: "TikTok Viral Storm", status: "live" as const, pool: "◈ 12,000", endsIn: "6h 22m", participants: 1840 },
    { id: "r2", name: "YouTube Shorts Blitz", status: "upcoming" as const, pool: "◈ 8,500", startsIn: "14h 05m", participants: 0 },
    { id: "r3", name: "Reels Domination", status: "upcoming" as const, pool: "◈ 6,200", startsIn: "2d 08h", participants: 0 },
    { id: "r4", name: "Portal Clip Classic", status: "past" as const, pool: "◈ 15,000", winner: "ShadowReel_X", participants: 3200 },
    { id: "r5", name: "Meme Matrix Raid", status: "past" as const, pool: "◈ 9,800", winner: "VoidClipper", participants: 2100 },
  ],
};

export const REFERRAL_CHAMPIONS = {
  daily: [
    { rank: 1, name: "PortalKing_99", referrals: 47, reward: "◈ 2,500" },
    { rank: 2, name: "NeonRecruiter", referrals: 38, reward: "◈ 1,800" },
    { rank: 3, name: "GoldLinker", referrals: 31, reward: "◈ 1,200" },
  ],
  weekly: [
    { rank: 1, name: "AllianceMaster", referrals: 214, reward: "◈ 12,000" },
    { rank: 2, name: "VoidNetwork", referrals: 189, reward: "◈ 8,500" },
    { rank: 3, name: "StarRecruit", referrals: 156, reward: "◈ 5,000" },
  ],
  monthly: [
    { rank: 1, name: "LegendBuilder", referrals: 892, reward: "◈ 50,000" },
    { rank: 2, name: "EmpireForge", referrals: 756, reward: "◈ 35,000" },
    { rank: 3, name: "CosmicInvite", referrals: 621, reward: "◈ 22,000" },
  ],
};

export const IDENTITY_QUESTIONS = [
  { step: 1, question: "What is your explorer codename?", hint: "The name you chose at portal entry" },
  { step: 2, question: "Which world did you first conquer?", hint: "Select from your mission history" },
  { step: 3, question: "Verify your portal signature", hint: "Complete the encrypted phrase" },
];

export const SPECIAL_MISSIONS = [
  { id: "s1", title: "Create 100 Emails", reward: "◈ 3,500", difficulty: "Hard", icon: "📧", slots: 12 },
  { id: "s2", title: "Join Telegram Campaign", reward: "◈ 1,200", difficulty: "Medium", icon: "✈️", slots: 48 },
  { id: "s3", title: "Submit Research List", reward: "◈ 2,800", difficulty: "Hard", icon: "🔬", slots: 8 },
  { id: "s4", title: "Complete Custom Task", reward: "◈ 5,000", difficulty: "Legendary", icon: "⚡", slots: 3 },
  { id: "s5", title: "Data Collection Mission", reward: "◈ 4,200", difficulty: "Epic", icon: "📊", slots: 15 },
];

export const LEADERBOARD_TABS = ["Today", "This Week", "This Month", "Season"] as const;

export const LEADERBOARD_DATA: Record<(typeof LEADERBOARD_TABS)[number], { rank: number; name: string; score: number; badge: string }[]> = {
  Today: [
    { rank: 1, name: "VoidRunner_X", score: 9840, badge: "👑" },
    { rank: 2, name: "NeonBlade", score: 8720, badge: "⚔️" },
    { rank: 3, name: "GoldPhantom", score: 8100, badge: "🏆" },
    { rank: 4, name: "StarHunter", score: 7650, badge: "⭐" },
    { rank: 5, name: "ClipMaster", score: 7200, badge: "🎬" },
  ],
  "This Week": [
    { rank: 1, name: "RaidLegend", score: 48200, badge: "👑" },
    { rank: 2, name: "PortalAce", score: 44100, badge: "⚔️" },
    { rank: 3, name: "MysteryKing", score: 39800, badge: "🏆" },
    { rank: 4, name: "LinkForge", score: 36500, badge: "🔗" },
    { rank: 5, name: "Champion_X", score: 34200, badge: "💎" },
  ],
  "This Month": [
    { rank: 1, name: "SeasonTitan", score: 184000, badge: "👑" },
    { rank: 2, name: "EmpireVoid", score: 167500, badge: "⚔️" },
    { rank: 3, name: "GoldEmpire", score: 152300, badge: "🏆" },
    { rank: 4, name: "NeonEmpire", score: 138900, badge: "⭐" },
    { rank: 5, name: "DarkChampion", score: 125600, badge: "💎" },
  ],
  Season: [
    { rank: 1, name: "EternalChampion", score: 892000, badge: "👑" },
    { rank: 2, name: "PortalGod", score: 845000, badge: "⚔️" },
    { rank: 3, name: "MysteryLord", score: 798000, badge: "🏆" },
    { rank: 4, name: "VoidEmperor", score: 756000, badge: "⭐" },
    { rank: 5, name: "LegendForge", score: 712000, badge: "💎" },
  ],
};

export const REWARD_POOLS = [
  { period: "Daily", amount: "◈ 48,500", winners: 50, icon: "☀️", glow: "gold" as const },
  { period: "Weekly", amount: "◈ 285,000", winners: 100, icon: "📅", glow: "violet" as const },
  { period: "Monthly", amount: "◈ 1,200,000", winners: 250, icon: "🌙", glow: "gold" as const },
  { period: "Seasonal", amount: "◈ 5,000,000", winners: 500, icon: "👑", glow: "violet" as const },
];

export const CHALLENGE_RULES = [
  "All submissions must be original and verifiable. Duplicate or fraudulent links are permanently banned.",
  "Timed raids open at scheduled portal times. Late entries cannot be accepted once a raid closes.",
  "Referral rewards require verified account activation — bot referrals are void and may trigger penalties.",
  "Identity challenges are single-attempt per cycle. Failed verification locks for 24 portal hours.",
  "Special missions require manual proof upload. Approval times vary from 2–48 hours.",
  "Reward pools distribute automatically at cycle end. Minimum withdrawal thresholds apply.",
  "Portal command reserves the right to adjust pools during special events without prior notice.",
  "Fair play is enforced. Exploit attempts result in account suspension and forfeited rewards.",
];

/** Precomputed fog layer positions — static, no Math.random */
export const FOG_LAYERS = [
  { id: 0, left: "0%", top: "20%", width: "55%", height: "40%", delay: 0, duration: 18 },
  { id: 1, left: "40%", top: "50%", width: "60%", height: "35%", delay: 3, duration: 22 },
  { id: 2, left: "10%", top: "70%", width: "45%", height: "30%", delay: 6, duration: 20 },
  { id: 3, left: "55%", top: "10%", width: "50%", height: "45%", delay: 2, duration: 24 },
];

export const PARTICLE_POSITIONS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 7) % 100}%`,
  top: `${(i * 23 + 11) % 100}%`,
  size: 2 + (i % 3),
  delay: (i % 10) * 0.4,
  duration: 6 + (i % 5),
}));
