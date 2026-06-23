/** Comprehensive mock data for all public, dashboard, and page content */
export * from "./mock-data";

export const PUBLIC_REWARDS = [
  { id: "r1", name: "Daily Login Bonus", type: "daily", amount: "50 coins", icon: "☀️", tier: "common" },
  { id: "r2", name: "Mission Completion", type: "mission", amount: "100–500 coins", icon: "⚔️", tier: "rare" },
  { id: "r3", name: "Weekly Challenge", type: "challenge", amount: "500 XP + Badge", icon: "🏆", tier: "epic" },
  { id: "r4", name: "Referral Bonus", type: "referral", amount: "500 coins/ally", icon: "🔗", tier: "gold" },
  { id: "r5", name: "Treasure Chest", type: "treasure", amount: "Random loot", icon: "📦", tier: "legendary" },
  { id: "r6", name: "Leaderboard Prize", type: "rank", amount: "Top 10 rewards", icon: "👑", tier: "legendary" },
];

export const MARKETPLACE_CATEGORIES = [
  { id: "boosts", name: "Boosts", icon: "⚡", count: 12 },
  { id: "cosmetics", name: "Cosmetics", icon: "✨", count: 24 },
  { id: "utility", name: "Utility", icon: "🔧", count: 8 },
  { id: "bundles", name: "Bundles", icon: "🎁", count: 6 },
];

export const MARKETPLACE_ITEMS = [
  { id: "m1", name: "XP Boost 24h", price: 250, type: "boost", icon: "⚡", featured: true, desc: "Double XP for 24 hours" },
  { id: "m2", name: "Gold Frame", price: 500, type: "cosmetic", icon: "🖼️", featured: false, desc: "Legendary profile border" },
  { id: "m3", name: "Mission Reroll", price: 150, type: "utility", icon: "🔄", featured: false, desc: "Reroll one daily mission" },
  { id: "m4", name: "Portal Emote Pack", price: 800, type: "cosmetic", icon: "✨", featured: true, desc: "12 exclusive emotes" },
  { id: "m5", name: "Void Skin Bundle", price: 1200, type: "cosmetic", icon: "🌌", featured: true, desc: "Complete void aesthetic set" },
  { id: "m6", name: "Coin Multiplier", price: 600, type: "boost", icon: "💎", featured: false, desc: "1.5× coins for 12 hours" },
  { id: "m7", name: "Legendary Chest Key", price: 2000, type: "utility", icon: "🔑", featured: true, desc: "Unlock one legendary chest" },
  { id: "m8", name: "Neon Trail Effect", price: 950, type: "cosmetic", icon: "🌈", featured: false, desc: "Animated profile trail" },
];

export const BLOG_POSTS = [
  { id: "b1", slug: "portal-genesis", title: "Portal Genesis: The Birth of Tasks.cash", excerpt: "How we built a AAA-quality gamified task platform from the void.", author: "Void Team", date: "Jun 15, 2026", category: "Announcements", readTime: "5 min", icon: "🚀" },
  { id: "b2", slug: "weekly-challenges", title: "Weekly Challenges: Maximize Your Rewards", excerpt: "Pro strategies to dominate the leaderboard every week.", author: "NovaBlade", date: "Jun 10, 2026", category: "Guides", readTime: "8 min", icon: "🏆" },
  { id: "b3", slug: "treasure-system", title: "Treasure System Deep Dive", excerpt: "Everything about chests, rarities, and legendary drops.", author: "GoldWarden", date: "Jun 5, 2026", category: "Guides", readTime: "6 min", icon: "💎" },
  { id: "b4", slug: "referral-program", title: "Referral Program: Build Your Army", excerpt: "Earn passive coins by inviting allies to the portal.", author: "Portal Team", date: "May 28, 2026", category: "Features", readTime: "4 min", icon: "🔗" },
  { id: "b5", slug: "roadmap-update", title: "Q3 Roadmap Update: 3D Worlds Incoming", excerpt: "Three.js integration and mobile apps on the horizon.", author: "Void Team", date: "May 20, 2026", category: "Announcements", readTime: "7 min", icon: "🌐" },
  { id: "b6", slug: "community-spotlight", title: "Community Spotlight: Top Guilds", excerpt: "Meet the guilds dominating this season's tournaments.", author: "Community Team", date: "May 12, 2026", category: "Community", readTime: "5 min", icon: "👥" },
];

export const HELP_CATEGORIES = [
  { id: "getting-started", title: "Getting Started", icon: "🚀", articles: 8 },
  { id: "missions", title: "Missions & Challenges", icon: "⚔️", articles: 12 },
  { id: "rewards", title: "Rewards & Wallet", icon: "💰", articles: 10 },
  { id: "account", title: "Account & Security", icon: "🔐", articles: 7 },
  { id: "technical", title: "Technical Support", icon: "🔧", articles: 5 },
];

export const HELP_ARTICLES = [
  { id: "h1", title: "How to create your account", category: "getting-started", views: 12400 },
  { id: "h2", title: "Completing your first mission", category: "getting-started", views: 9800 },
  { id: "h3", title: "Understanding XP and levels", category: "getting-started", views: 8200 },
  { id: "h4", title: "How to submit mission proof", category: "missions", views: 7600 },
  { id: "h5", title: "Weekly challenge rules", category: "missions", views: 5400 },
  { id: "h6", title: "Withdrawing coins to wallet", category: "rewards", views: 11200 },
  { id: "h7", title: "Two-factor authentication setup", category: "account", views: 4300 },
  { id: "h8", title: "Troubleshooting login issues", category: "technical", views: 6100 },
];

export const LEGAL_SECTIONS = {
  terms: [
    { title: "1. Acceptance of Terms", content: "By accessing Tasks.cash, you agree to be bound by these Terms of Service. If you do not agree, do not enter the portal." },
    { title: "2. Eligibility", content: "You must be at least 18 years old or have parental consent to use the platform. One account per person." },
    { title: "3. Account Responsibilities", content: "You are responsible for maintaining the confidentiality of your credentials and all activity under your account." },
    { title: "4. Mission Completion", content: "Rewards are granted upon verified mission completion. Fraudulent submissions result in account suspension." },
    { title: "5. Virtual Currency", content: "Portal coins are virtual currency with no guaranteed cash value unless explicitly stated in withdrawal terms." },
    { title: "6. Prohibited Conduct", content: "Cheating, botting, multi-accounting, and exploiting bugs are strictly prohibited." },
    { title: "7. Termination", content: "We reserve the right to suspend or terminate accounts that violate these terms." },
    { title: "8. Changes", content: "We may update these terms. Continued use constitutes acceptance of revised terms." },
  ],
  privacy: [
    { title: "Information We Collect", content: "We collect account data, mission submissions, usage analytics, and device information to operate the platform." },
    { title: "How We Use Data", content: "Data is used to provide services, process rewards, improve the platform, and communicate with you." },
    { title: "Data Sharing", content: "We do not sell personal data. We share data with service providers under strict agreements." },
    { title: "Security", content: "We implement encryption, access controls, and regular security audits to protect your data." },
    { title: "Your Rights", content: "You may request access, correction, or deletion of your personal data subject to legal requirements." },
    { title: "Cookies", content: "See our Cookie Policy for details on how we use cookies and similar technologies." },
  ],
  refund: [
    { title: "Virtual Purchases", content: "Marketplace purchases using portal coins are generally non-refundable once delivered." },
    { title: "Withdrawal Requests", content: "Approved withdrawal requests cannot be reversed once processed to your external wallet." },
    { title: "Disputed Transactions", content: "Contact support within 14 days of a disputed transaction for review." },
    { title: "Service Interruptions", content: "Credits may be issued for extended platform outages at our discretion." },
    { title: "Chargebacks", content: "Fraudulent chargebacks may result in permanent account termination." },
  ],
  cookies: [
    { title: "Essential Cookies", content: "Required for authentication, security, and core platform functionality." },
    { title: "Analytics Cookies", content: "Help us understand usage patterns to improve the portal experience." },
    { title: "Preference Cookies", content: "Remember your settings such as theme and language preferences." },
    { title: "Marketing Cookies", content: "Used to deliver relevant promotions with your consent." },
    { title: "Managing Cookies", content: "You can manage cookie preferences in your browser settings or our cookie banner." },
  ],
};

export const ABOUT_TEAM = [
  { name: "Alex Void", role: "Founder & CEO", avatar: "AV", bio: "Former game director bringing AAA quality to productivity." },
  { name: "Sarah Nova", role: "Head of Design", avatar: "SN", bio: "Crafting the dark fantasy sci-fi portal aesthetic." },
  { name: "Marcus Gold", role: "Lead Engineer", avatar: "MG", bio: "Building scalable systems across dimensions." },
  { name: "Elena Portal", role: "Community Lead", avatar: "EP", bio: "Connecting explorers across the multiverse." },
];

export const ABOUT_MILESTONES = [
  { year: "2024", event: "Concept & prototype launched" },
  { year: "2025", event: "Beta with 100K explorers" },
  { year: "2026", event: "Public launch — targeting 1M explorers" },
  { year: "2027", event: "3D worlds & mobile apps" },
];

export const COMMUNITY_STATS = [
  { label: "Active Members", value: "847K+", icon: "👥" },
  { label: "Discord Online", value: "12K", icon: "💬" },
  { label: "Guilds", value: "2,400+", icon: "⚔️" },
  { label: "Events/Month", value: "48", icon: "🏟️" },
];

export const CONTACT_INFO = [
  { label: "Email", value: "support@tasks.cash", icon: "✉️" },
  { label: "Discord", value: "discord.gg/taskscash", icon: "💬" },
  { label: "Response Time", value: "Within 24 hours", icon: "⏱️" },
];

// Dashboard mock data
export const DASHBOARD_MISSIONS = [
  { id: "dm1", title: "Daily Portal Scan", world: "Void Nexus", reward: "150 coins", progress: 75, status: "active", difficulty: "Easy" },
  { id: "dm2", title: "Neon Data Harvest", world: "Neon Frontier", reward: "300 coins", progress: 40, status: "active", difficulty: "Medium" },
  { id: "dm3", title: "Gold Vault Patrol", world: "Gold Realm", reward: "500 coins", progress: 100, status: "completed", difficulty: "Hard" },
  { id: "dm4", title: "Shadow Grove Quest", world: "Shadow Grove", reward: "200 coins", progress: 0, status: "available", difficulty: "Easy" },
];

export const DASHBOARD_TRANSACTIONS = [
  { id: "t1", desc: "Mission reward — Portal Scan", amount: 150, type: "credit", date: "Jun 21, 2026" },
  { id: "t2", desc: "Marketplace — XP Boost", amount: -250, type: "debit", date: "Jun 20, 2026" },
  { id: "t3", desc: "Referral bonus — NovaBlade", amount: 50, type: "credit", date: "Jun 19, 2026" },
  { id: "t4", desc: "Weekly challenge prize", amount: 500, type: "credit", date: "Jun 18, 2026" },
  { id: "t5", desc: "Withdrawal to wallet", amount: -1000, type: "debit", date: "Jun 15, 2026" },
];

export const DASHBOARD_REWARDS = [
  { id: "dr1", name: "Daily Login Streak", status: "claimed", amount: "50 coins", date: "Jun 21" },
  { id: "dr2", name: "Weekly Challenge", status: "pending", amount: "500 XP", date: "Jun 20" },
  { id: "dr3", name: "Referral Bonus", status: "claimed", amount: "100 coins", date: "Jun 18" },
  { id: "dr4", name: "Treasure Chest", status: "available", amount: "Random loot", date: "Jun 17" },
];

export const DASHBOARD_WITHDRAWALS = [
  { id: "w1", amount: 1000, status: "completed", method: "Crypto Wallet", date: "Jun 15, 2026" },
  { id: "w2", amount: 500, status: "pending", method: "PayPal", date: "Jun 20, 2026" },
  { id: "w3", amount: 250, status: "processing", method: "Bank Transfer", date: "Jun 19, 2026" },
];

export const DASHBOARD_REFERRALS = [
  { username: "NovaBlade", joined: "Jun 10", earned: 500, status: "active" },
  { username: "StarRunner", joined: "Jun 5", earned: 250, status: "active" },
  { username: "GoldWarden", joined: "May 28", earned: 750, status: "active" },
];

export const DASHBOARD_NOTIFICATIONS = [
  { id: "n1", title: "Mission Approved", message: "Your Portal Scan proof was verified.", time: "2h ago", read: false, type: "success" },
  { id: "n2", title: "New Challenge", message: "Coin Rush Weekend starts tomorrow.", time: "5h ago", read: false, type: "info" },
  { id: "n3", title: "Level Up!", message: "You reached Level 12 — Void Walker.", time: "1d ago", read: true, type: "gold" },
  { id: "n4", title: "Withdrawal Complete", message: "1,000 coins sent to your wallet.", time: "6d ago", read: true, type: "success" },
];

export const DASHBOARD_TICKETS = [
  { id: "TK-1042", subject: "Withdrawal delay", status: "open", priority: "high", updated: "Jun 20" },
  { id: "TK-1038", subject: "Mission proof rejected", status: "resolved", priority: "medium", updated: "Jun 15" },
];

export const DASHBOARD_XP_HISTORY = [
  { action: "Mission completed", xp: 250, date: "Jun 21" },
  { action: "Daily login", xp: 50, date: "Jun 21" },
  { action: "Referral bonus", xp: 100, date: "Jun 19" },
  { action: "Challenge prize", xp: 500, date: "Jun 18" },
];

export const DASHBOARD_ACHIEVEMENTS = [
  { name: "First Portal", unlocked: true, icon: "🚪" },
  { name: "Coin Hoarder", unlocked: true, icon: "💰" },
  { name: "Void Conqueror", unlocked: false, icon: "🌌" },
  { name: "Referral Master", unlocked: true, icon: "🔗" },
];
