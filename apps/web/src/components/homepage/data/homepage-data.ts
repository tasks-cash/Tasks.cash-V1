export const HOMEPAGE_STATS = {
  registeredUsers: 847293,
  registeredTarget: 1000000,
  onlineUsers: 3847,
  rewardsDistributed: 2847291,
  activeMissions: 156,
};

export const FEATURED_WORLDS = [
  {
    id: "void-nexus",
    name: "Void Nexus",
    desc: "Shattered obsidian dimensions where reality fractures into infinite loot.",
    difficulty: "Legendary",
    missions: 12,
    explorers: 48200,
    icon: "🌌",
    gradient: "from-violet-900/80 to-black",
  },
  {
    id: "gold-realm",
    name: "Gold Realm",
    desc: "Ancient vaults where portal coins were first forged by celestial smiths.",
    difficulty: "Hard",
    missions: 18,
    explorers: 72100,
    icon: "👑",
    gradient: "from-amber-900/60 to-black",
  },
  {
    id: "neon-frontier",
    name: "Neon Frontier",
    desc: "Cyber-spires pulsing with quantum energy and holographic bounty boards.",
    difficulty: "Medium",
    missions: 24,
    explorers: 95400,
    icon: "⚡",
    gradient: "from-cyan-900/50 to-black",
  },
  {
    id: "shadow-grove",
    name: "Shadow Grove",
    desc: "Whispering forests between dimensions — secrets hide in every shadow.",
    difficulty: "Easy",
    missions: 15,
    explorers: 63800,
    icon: "🌲",
    gradient: "from-emerald-900/40 to-black",
  },
];

export const MISSION_CATEGORIES = [
  { id: "combat", name: "Combat Quests", icon: "⚔️", count: 42, color: "purple" },
  { id: "exploration", name: "Exploration", icon: "🧭", count: 38, color: "gold" },
  { id: "social", name: "Social Missions", icon: "👥", count: 29, color: "purple" },
  { id: "crafting", name: "Crafting", icon: "🔨", count: 21, color: "gold" },
  { id: "stealth", name: "Stealth Ops", icon: "🗡️", count: 18, color: "purple" },
  { id: "arcane", name: "Arcane Rituals", icon: "✨", count: 15, color: "gold" },
];

export const DAILY_MISSIONS = [
  { id: "d1", title: "Portal Patrol", reward: "250 XP", coins: 50, progress: 100, done: true },
  { id: "d2", title: "Coin Collector", reward: "150 XP", coins: 30, progress: 65, done: false },
  { id: "d3", title: "Ally Summoner", reward: "300 XP", coins: 75, progress: 20, done: false },
  { id: "d4", title: "Void Scanner", reward: "500 XP", coins: 100, progress: 0, done: false },
];

export const WEEKLY_CHALLENGES = [
  { id: "w1", title: "7-Day Streak", reward: "500 XP + Badge", endsIn: "3d 12h", participants: 8420, tier: "gold" },
  { id: "w2", title: "Coin Rush Weekend", reward: "2× Coins", endsIn: "1d 4h", participants: 12050, tier: "purple" },
  { id: "w3", title: "Portal Sprint", reward: "Legendary Chest", endsIn: "5d 8h", participants: 3100, tier: "gold" },
  { id: "w4", title: "Dimension Raider", reward: "Epic Blade Skin", endsIn: "2d 18h", participants: 5670, tier: "purple" },
];

export const TREASURE_ITEMS = [
  { id: "t1", name: "Obsidian Crown", rarity: "legendary", icon: "👑", glow: "gold" },
  { id: "t2", name: "Quantum Blade", rarity: "epic", icon: "⚔️", glow: "purple" },
  { id: "t3", name: "Void Compass", rarity: "rare", icon: "🧭", glow: "purple" },
  { id: "t4", name: "Portal Key", rarity: "legendary", icon: "🔑", glow: "gold" },
  { id: "t5", name: "Star Fragment", rarity: "epic", icon: "💎", glow: "gold" },
  { id: "t6", name: "Shadow Cloak", rarity: "rare", icon: "🌑", glow: "purple" },
];

export const CHEST_TYPES = [
  { id: "c1", name: "Bronze Cache", rarity: "common", rewards: "50–200 coins", icon: "📦" },
  { id: "c2", name: "Silver Vault", rarity: "rare", rewards: "200–800 coins", icon: "🎁" },
  { id: "c3", name: "Gold Reliquary", rarity: "epic", rewards: "Epic items + coins", icon: "🏆" },
  { id: "c4", name: "Legendary Nexus", rarity: "legendary", rewards: "Legendary drops", icon: "👑" },
];

export const LEVEL_TIERS = [
  { level: 1, title: "Portal Initiate", xp: 0 },
  { level: 10, title: "Void Walker", xp: 5000 },
  { level: 25, title: "Gold Seeker", xp: 25000 },
  { level: 50, title: "Dimension Lord", xp: 100000 },
  { level: 100, title: "Celestial Overlord", xp: 500000 },
];

export const SKILLS = [
  { id: "s1", name: "Portal Mastery", level: 7, max: 10, icon: "◈" },
  { id: "s2", name: "Coin Magnetism", level: 5, max: 10, icon: "🧲" },
  { id: "s3", name: "Stealth Protocol", level: 3, max: 10, icon: "🗡️" },
  { id: "s4", name: "Arcane Forge", level: 8, max: 10, icon: "🔥" },
];

export const ACHIEVEMENTS = [
  { id: "a1", name: "First Portal", desc: "Complete your first mission", unlocked: true, icon: "🚪" },
  { id: "a2", name: "Coin Hoarder", desc: "Earn 10,000 coins", unlocked: true, icon: "💰" },
  { id: "a3", name: "Void Conqueror", desc: "Clear Void Nexus", unlocked: false, icon: "🌌" },
  { id: "a4", name: "Legend Born", desc: "Reach Level 50", unlocked: false, icon: "👑" },
];

export const LEADERBOARD = [
  { rank: 1, username: "VoidKing", level: 42, xp: 98500, coins: 12400 },
  { rank: 2, username: "NovaBlade", level: 38, xp: 87200, coins: 9800 },
  { rank: 3, username: "GoldWarden", level: 35, xp: 76100, coins: 8900 },
  { rank: 4, username: "PortalMage", level: 31, xp: 65400, coins: 7200 },
  { rank: 5, username: "StarRunner", level: 28, xp: 58900, coins: 6100 },
];

export const GLOBAL_RANKINGS = [
  { region: "North America", explorers: 284000, topPlayer: "VoidKing" },
  { region: "Europe", explorers: 198000, topPlayer: "NovaBlade" },
  { region: "Asia Pacific", explorers: 312000, topPlayer: "GoldWarden" },
  { region: "Global", explorers: 847293, topPlayer: "VoidKing" },
];

export const REFERRAL_TIERS = [
  { tier: "Scout", invites: 1, reward: "500 coins", bonus: "5% forever" },
  { tier: "Commander", invites: 10, reward: "5,000 coins", bonus: "10% forever" },
  { tier: "Warlord", invites: 50, reward: "Legendary Chest", bonus: "15% forever" },
  { tier: "Overlord", invites: 100, reward: "Exclusive Title", bonus: "20% forever" },
];

export const WHEEL_PRIZES = [
  { label: "50 Coins", weight: 30, color: "purple" },
  { label: "100 XP", weight: 25, color: "purple" },
  { label: "200 Coins", weight: 20, color: "gold" },
  { label: "Rare Item", weight: 15, color: "gold" },
  { label: "Epic Chest", weight: 8, color: "gold" },
  { label: "Jackpot!", weight: 2, color: "gold" },
];

export const MARKETPLACE_ITEMS = [
  { id: "m1", name: "XP Boost 24h", price: 250, type: "boost", icon: "⚡", featured: true },
  { id: "m2", name: "Gold Frame", price: 500, type: "cosmetic", icon: "🖼️", featured: false },
  { id: "m3", name: "Mission Reroll", price: 150, type: "utility", icon: "🔄", featured: false },
  { id: "m4", name: "Portal Emote Pack", price: 800, type: "cosmetic", icon: "✨", featured: true },
  { id: "m5", name: "Void Skin Bundle", price: 1200, type: "cosmetic", icon: "🌌", featured: true },
  { id: "m6", name: "Coin Multiplier", price: 600, type: "boost", icon: "💎", featured: false },
];

export const AI_FEATURES = [
  { title: "Mission Advisor", desc: "AI recommends optimal missions based on your skill tree and goals.", icon: "🤖" },
  { title: "Loot Predictor", desc: "Analyze drop rates and maximize your treasure haul efficiency.", icon: "📊" },
  { title: "Strategy Coach", desc: "Real-time tips to climb leaderboards faster.", icon: "🎯" },
  { title: "Portal Guide", desc: "24/7 conversational assistant for all platform questions.", icon: "💬" },
];

export const COMMUNITY_HIGHLIGHTS = [
  { title: "Weekly Tournaments", members: "12K+", icon: "🏟️" },
  { title: "Guild Battles", members: "8.5K+", icon: "⚔️" },
  { title: "Creator Program", members: "2.1K+", icon: "🎬" },
  { title: "Beta Testers", members: "5K+", icon: "🧪" },
];

export const SOCIAL_LINKS = [
  { name: "Discord", href: "#", members: "45K+", icon: "💬", color: "from-indigo-600/30" },
  { name: "Telegram", href: "#", members: "28K+", icon: "✈️", color: "from-sky-600/30" },
  { name: "Twitter / X", href: "#", members: "62K+", icon: "𝕏", color: "from-purple-600/30" },
  { name: "YouTube", href: "#", members: "18K+", icon: "▶️", color: "from-red-600/30" },
];

export const ROADMAP = [
  { phase: "Phase I", title: "Portal Genesis", status: "complete", items: ["Core missions", "Coin wallet", "Level system"] },
  { phase: "Phase II", title: "Dimension Expansion", status: "active", items: ["New worlds", "Weekly challenges", "Treasure chests"] },
  { phase: "Phase III", title: "Multiplayer Nexus", status: "upcoming", items: ["Guild system", "PvP arenas", "Cross-world raids"] },
  { phase: "Phase IV", title: "Celestial Engine", status: "upcoming", items: ["Three.js worlds", "Native apps", "AI mission generator"] },
];

export const UPCOMING_FEATURES = [
  { title: "3D Portal Worlds", eta: "Q3 2026", icon: "🌐" },
  { title: "Mobile App Launch", eta: "Q4 2026", icon: "📱" },
  { title: "NFT Treasure Vault", eta: "Q1 2027", icon: "🔐" },
  { title: "Voice AI Companion", eta: "Q2 2027", icon: "🎙️" },
];

export const TESTIMONIALS = [
  { quote: "Tasks.cash feels like launching a AAA game every morning. The portal aesthetic is unmatched.", author: "Alex V.", role: "Void Walker · Lvl 38", avatar: "AV" },
  { quote: "I've earned more here in 3 months than any other rewards platform. The missions are actually fun.", author: "Sarah K.", role: "Gold Seeker · Lvl 29", avatar: "SK" },
  { quote: "The leaderboard competition is addictive. My guild lives for the weekly challenges.", author: "Marcus T.", role: "Dimension Lord · Lvl 51", avatar: "MT" },
];

export const FAQ_ITEMS = [
  { q: "What is Tasks.cash?", a: "A premium gamified task platform where real-world missions earn XP, coins, and legendary rewards across dimensional worlds." },
  { q: "How do I earn coins?", a: "Complete missions, win weekly challenges, open treasure chests, spin the daily reward wheel, and refer allies to the portal." },
  { q: "Is there a limit to explorers?", a: "We're targeting the first 1,000,000 explorers. Early registrants receive exclusive founder badges and bonus coins." },
  { q: "Can I withdraw coins?", a: "Yes — eligible balances can be withdrawn through your dashboard wallet once verification is complete." },
  { q: "Will there be a mobile app?", a: "Native iOS and Android apps are on the roadmap for Q4 2026. The web platform is fully mobile-optimized today." },
  { q: "How does the 3D portal work?", a: "Our Three.js integration is coming in Phase IV. The current portal canvas is a preview of the immersive experience ahead." },
];

export const RARITY_COLORS: Record<string, string> = {
  common: "border-gray-500/40 text-gray-300",
  rare: "border-blue-500/40 text-blue-300",
  epic: "border-purple-500/40 text-purple-300",
  legendary: "border-amber-500/40 text-amber-300",
};
