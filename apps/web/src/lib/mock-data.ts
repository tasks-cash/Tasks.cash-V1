/** Mock data for pages where backend is not wired yet */
export const WORLDS = [
  { id: "void-nexus", name: "Void Nexus", desc: "A shattered dimension of floating obsidian shards.", difficulty: "Legendary", missions: 12, icon: "🌌" },
  { id: "gold-realm", name: "Gold Realm", desc: "Ancient vaults where portal coins were first forged.", difficulty: "Hard", missions: 18, icon: "👑" },
  { id: "neon-frontier", name: "Neon Frontier", desc: "Cyber-spires pulsing with quantum energy.", difficulty: "Medium", missions: 24, icon: "⚡" },
  { id: "shadow-grove", name: "Shadow Grove", desc: "Whispering forests between dimensions.", difficulty: "Easy", missions: 15, icon: "🌲" },
];

export const PUBLIC_CHALLENGES = [
  { id: "1", title: "7-Day Streak", reward: "500 XP + Badge", endsIn: "3d 12h", participants: 8420 },
  { id: "2", title: "Coin Rush Weekend", reward: "2x Coins", endsIn: "1d 4h", participants: 12050 },
  { id: "3", title: "Portal Sprint", reward: "Legendary Chest", endsIn: "5d 8h", participants: 3100 },
];

export const TREASURES = [
  { id: "1", name: "Obsidian Crown", rarity: "legendary", locked: false, icon: "👑" },
  { id: "2", name: "Quantum Blade", rarity: "epic", locked: true, icon: "⚔️" },
  { id: "3", name: "Void Compass", rarity: "rare", locked: false, icon: "🧭" },
  { id: "4", name: "Portal Key", rarity: "legendary", locked: true, icon: "🔑" },
];

export const STORE_ITEMS = [
  { id: "1", name: "XP Boost 24h", price: 250, type: "boost", icon: "⚡" },
  { id: "2", name: "Gold Frame", price: 500, type: "cosmetic", icon: "🖼️" },
  { id: "3", name: "Mission Reroll", price: 150, type: "utility", icon: "🔄" },
  { id: "4", name: "Portal Emote Pack", price: 800, type: "cosmetic", icon: "✨" },
];

export const FAQ_ITEMS = [
  { q: "What is Tasks.cash?", a: "A gamified task platform where real-world missions earn XP, coins, and legendary rewards." },
  { q: "How do I earn coins?", a: "Complete missions, win challenges, refer allies, and climb leaderboards." },
  { q: "Can I withdraw coins?", a: "Yes — eligible balances can be withdrawn through your dashboard wallet." },
  { q: "Is there a mobile app?", a: "The platform is mobile-first responsive; native apps are on the roadmap." },
];

export const LEADERBOARD_MOCK = [
  { rank: 1, username: "VoidKing", level: 42, xp: 98500, coins: 12400 },
  { rank: 2, username: "NovaBlade", level: 38, xp: 87200, coins: 9800 },
  { rank: 3, username: "GoldWarden", level: 35, xp: 76100, coins: 8900 },
  { rank: 4, username: "PortalMage", level: 31, xp: 65400, coins: 7200 },
  { rank: 5, username: "StarRunner", level: 28, xp: 58900, coins: 6100 },
];

export const ADMIN_STATS = [
  { label: "Total Users", value: "12,847", change: "+12%" },
  { label: "Active Missions", value: "156", change: "+3" },
  { label: "Pending Withdrawals", value: "23", change: "⚠" },
  { label: "Revenue (Coins)", value: "2.4M", change: "+8%" },
];
