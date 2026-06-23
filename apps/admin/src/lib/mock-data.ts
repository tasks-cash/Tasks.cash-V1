/** Admin dashboard mock data */

export const ADMIN_USERS = [
  { id: "U1001", username: "VoidKing", email: "void@example.com", level: 42, coins: 12400, status: "active" },
  { id: "U1002", username: "NovaBlade", email: "nova@example.com", level: 38, coins: 9800, status: "active" },
  { id: "U1003", username: "GoldWarden", email: "gold@example.com", level: 35, coins: 8900, status: "active" },
  { id: "U1004", username: "PortalMage", email: "mage@example.com", level: 31, coins: 7200, status: "suspended" },
  { id: "U1005", username: "StarRunner", email: "star@example.com", level: 28, coins: 6100, status: "active" },
];

export const ADMIN_EMPLOYEES = [
  { id: "E101", name: "Alex Void", role: "Admin", department: "Operations", status: "active" },
  { id: "E102", name: "Sarah Nova", role: "Moderator", department: "Community", status: "active" },
  { id: "E103", name: "Marcus Gold", role: "Support", department: "Support", status: "active" },
  { id: "E104", name: "Elena Portal", role: "Analyst", department: "Analytics", status: "inactive" },
];

export const ADMIN_LEVELS = [
  { id: "L1", level: 1, title: "Portal Initiate", xpRequired: 0, reward: "50 coins" },
  { id: "L5", level: 5, title: "Void Scout", xpRequired: 5000, reward: "200 coins" },
  { id: "L10", level: 10, title: "Neon Runner", xpRequired: 15000, reward: "500 coins + Badge" },
  { id: "L20", level: 20, title: "Gold Seeker", xpRequired: 50000, reward: "1000 coins" },
  { id: "L30", level: 30, title: "Void Walker", xpRequired: 100000, reward: "Legendary Frame" },
];

export const ADMIN_WITHDRAWALS = [
  { id: "W501", user: "VoidKing", amount: 5000, method: "Crypto", status: "pending", date: "Jun 21" },
  { id: "W502", user: "NovaBlade", amount: 2500, method: "PayPal", status: "processing", date: "Jun 20" },
  { id: "W503", user: "GoldWarden", amount: 1000, method: "Bank", status: "completed", date: "Jun 18" },
];

export const ADMIN_REFERRALS = [
  { id: "R201", referrer: "VoidKing", referred: "StarRunner", bonus: 500, status: "paid" },
  { id: "R202", referrer: "NovaBlade", referred: "PortalMage", bonus: 500, status: "pending" },
];

export const ADMIN_CHALLENGES = [
  { id: "C1", title: "7-Day Streak", participants: 8420, status: "active", ends: "Jun 24" },
  { id: "C2", title: "Coin Rush Weekend", participants: 12050, status: "active", ends: "Jun 22" },
  { id: "C3", title: "Portal Sprint", participants: 3100, status: "scheduled", ends: "Jun 28" },
];

export const ADMIN_NOTIFICATIONS = [
  { id: "N1", title: "Platform Maintenance", audience: "All Users", sent: "Jun 20", status: "delivered" },
  { id: "N2", title: "New Challenge Live", audience: "Active Users", sent: "Jun 19", status: "delivered" },
];

export const ADMIN_TICKETS = [
  { id: "TK-1042", user: "PortalMage", subject: "Withdrawal delay", priority: "high", status: "open" },
  { id: "TK-1038", user: "StarRunner", subject: "Mission proof rejected", priority: "medium", status: "resolved" },
  { id: "TK-1035", user: "GoldWarden", subject: "Account verification", priority: "low", status: "open" },
];

export const ADMIN_ROLES = [
  { id: "R1", name: "Super Admin", permissions: 24, users: 2 },
  { id: "R2", name: "Moderator", permissions: 12, users: 5 },
  { id: "R3", name: "Support Agent", permissions: 8, users: 8 },
  { id: "R4", name: "Analyst", permissions: 6, users: 3 },
];

export const ADMIN_PERMISSIONS = [
  { id: "P1", name: "users.read", category: "Users", roles: 4 },
  { id: "P2", name: "users.write", category: "Users", roles: 2 },
  { id: "P3", name: "missions.manage", category: "Missions", roles: 3 },
  { id: "P4", name: "rewards.manage", category: "Rewards", roles: 2 },
  { id: "P5", name: "withdrawals.approve", category: "Finance", roles: 2 },
  { id: "P6", name: "settings.manage", category: "System", roles: 1 },
];

export const ADMIN_AUDIT_LOGS = [
  { id: "A1001", action: "User balance adjusted", actor: "Alex Void", target: "VoidKing", time: "Jun 21 14:32" },
  { id: "A1002", action: "Mission created", actor: "Sarah Nova", target: "Daily Portal Scan", time: "Jun 21 12:15" },
  { id: "A1003", action: "Withdrawal approved", actor: "Marcus Gold", target: "W503", time: "Jun 20 18:45" },
  { id: "A1004", action: "Role updated", actor: "Alex Void", target: "Moderator", time: "Jun 19 09:20" },
];

export const ADMIN_TREASURES = [
  { id: "T1", name: "Obsidian Crown", rarity: "legendary", unlocked: 142 },
  { id: "T2", name: "Quantum Blade", rarity: "epic", unlocked: 890 },
  { id: "T3", name: "Void Compass", rarity: "rare", unlocked: 2340 },
];

export const ADMIN_LEADERBOARDS = [
  { id: "LB1", season: "Season 4", leader: "VoidKing", participants: 12847, status: "active" },
  { id: "LB2", season: "Season 3", leader: "NovaBlade", participants: 10200, status: "completed" },
];

export const STATUS_BADGE: Record<string, string> = {
  active: "text-green-400",
  inactive: "text-purple-400",
  suspended: "text-red-400",
  pending: "text-amber-400",
  processing: "text-blue-400",
  completed: "text-green-400",
  open: "text-amber-400",
  resolved: "text-green-400",
  paid: "text-green-400",
  delivered: "text-green-400",
  scheduled: "text-purple-400",
};
