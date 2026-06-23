import type {
  CurrencyType,
  ICurrencies,
  ILiveReward,
  IRPGStat,
  IRPGStatProgress,
  IRPGStats,
  RPGStatType,
  IAchievementDefinition,
  IBadgeDefinition,
  ITreasureChestDefinition,
  IGameEventDefinition,
  BadgeTier,
} from "@tasks-cash/types";

/** Default zero currencies */
export function defaultCurrencies(): ICurrencies {
  return {
    bronze: 500,
    silver: 0,
    gold: 0,
    diamonds: 0,
    crystals: 0,
    legendTokens: 0,
    mythicCoins: 0,
    portalEnergy: 100,
  };
}

/** Default RPG stats for new players */
export function defaultRPGStats(): IRPGStats {
  const base = (): IRPGStat => ({ level: 1, xp: 0 });
  return {
    global: base(),
    strength: base(),
    intelligence: base(),
    speed: base(),
    luck: base(),
    life: base(),
    energy: base(),
    defense: base(),
    reputation: base(),
  };
}

export const CURRENCY_META: Record<
  CurrencyType,
  { label: string; icon: string; color: string; exchangeRate: number }
> = {
  bronze: { label: "Bronze Coins", icon: "🟤", color: "#cd7f32", exchangeRate: 1 },
  silver: { label: "Silver Coins", icon: "⚪", color: "#c0c0c0", exchangeRate: 10 },
  gold: { label: "Gold Coins", icon: "🟡", color: "#fbbf24", exchangeRate: 100 },
  diamonds: { label: "Diamond Gems", icon: "💎", color: "#60a5fa", exchangeRate: 500 },
  crystals: { label: "Crystal Shards", icon: "🔮", color: "#a855f7", exchangeRate: 250 },
  legendTokens: { label: "Legend Tokens", icon: "🏅", color: "#f97316", exchangeRate: 1000 },
  mythicCoins: { label: "Mythic Coins", icon: "✨", color: "#e879f9", exchangeRate: 5000 },
  portalEnergy: { label: "Portal Energy", icon: "⚡", color: "#7c3aed", exchangeRate: 0 },
};

export const RPG_STAT_META: Record<
  RPGStatType,
  { label: string; icon: string; color: string }
> = {
  global: { label: "Global Level", icon: "◈", color: "#fbbf24" },
  strength: { label: "Strength", icon: "💪", color: "#ef4444" },
  intelligence: { label: "Intelligence", icon: "🧠", color: "#3b82f6" },
  speed: { label: "Speed", icon: "⚡", color: "#22d3ee" },
  luck: { label: "Luck", icon: "🍀", color: "#4ade80" },
  life: { label: "Life", icon: "❤️", color: "#f87171" },
  energy: { label: "Energy", icon: "🔋", color: "#a855f7" },
  defense: { label: "Defense", icon: "🛡️", color: "#94a3b8" },
  reputation: { label: "Reputation", icon: "👑", color: "#d4af37" },
};

export const EXPLORER_RANKS = [
  { minLevel: 1, rank: "Portal Initiate" },
  { minLevel: 5, rank: "Bronze Explorer" },
  { minLevel: 10, rank: "Silver Pathfinder" },
  { minLevel: 20, rank: "Gold Vanguard" },
  { minLevel: 30, rank: "Diamond Warden" },
  { minLevel: 50, rank: "Legend of the Portal" },
  { minLevel: 75, rank: "Mythic Hero" },
  { minLevel: 100, rank: "Quantum Sovereign" },
] as const;

export function getExplorerRank(globalLevel: number): string {
  let rank: string = EXPLORER_RANKS[0].rank;
  for (const tier of EXPLORER_RANKS) {
    if (globalLevel >= tier.minLevel) rank = tier.rank;
  }
  return rank;
}

/** XP required per stat level (lighter curve than global) */
export function statXpForLevel(level: number, base = 200): number {
  return Math.floor(base * Math.pow(1.25, level - 1));
}

export function statProgress(stat: IRPGStat, base = 200): IRPGStatProgress {
  let level = 1;
  let xpUsed = 0;
  let remaining = stat.xp;
  while (remaining >= statXpForLevel(level, base)) {
    remaining -= statXpForLevel(level, base);
    xpUsed += statXpForLevel(level, base);
    level++;
  }
  const xpToNextLevel = statXpForLevel(level, base);
  const progress = Math.min(100, Math.floor((remaining / xpToNextLevel) * 100));
  return { level, xp: stat.xp, xpToNextLevel, progress };
}

export function buildRPGProgress(stats: IRPGStats): Record<RPGStatType, IRPGStatProgress> {
  const result = {} as Record<RPGStatType, IRPGStatProgress>;
  (Object.keys(stats) as RPGStatType[]).forEach((key) => {
    result[key] = statProgress(stats[key]);
  });
  return result;
}

export function addCurrency(
  currencies: ICurrencies,
  partial: Partial<ICurrencies>
): ICurrencies {
  const next = { ...currencies };
  (Object.keys(partial) as CurrencyType[]).forEach((key) => {
    const val = partial[key];
    if (val !== undefined) next[key] = Math.max(0, next[key] + val);
  });
  return next;
}

export function addStatXp(
  stats: IRPGStats,
  stat: RPGStatType,
  xpGain: number
): { stats: IRPGStats; leveledUp: boolean; newLevel: number } {
  const next = JSON.parse(JSON.stringify(stats)) as IRPGStats;
  const before = statProgress(next[stat]).level;
  next[stat].xp += xpGain;
  if (stat === "global") {
    next.global.level = statProgress(next.global).level;
  } else {
    next[stat].level = statProgress(next[stat]).level;
  }
  const after = statProgress(next[stat]).level;
  return { stats: next, leveledUp: after > before, newLevel: after };
}

export const ACHIEVEMENTS: IAchievementDefinition[] = [
  { id: "first_login", name: "First Login", description: "Enter the portal for the first time", icon: "🚪", category: "progression", rewardXp: 25 },
  { id: "first_mission", name: "First Mission", description: "Complete your first mission", icon: "⚔️", category: "progression", requiredMissions: 1, rewardXp: 50, badgeId: "bronze_explorer" },
  { id: "level_10", name: "Level 10", description: "Reach global level 10", icon: "🔟", category: "progression", requiredLevel: 10, rewardXp: 200, badgeId: "silver_pathfinder" },
  { id: "invite_5", name: "Recruiter", description: "Invite 5 friends to the portal", icon: "🔗", category: "social", requiredReferrals: 5, rewardCurrency: { legendTokens: 1 } },
  { id: "missions_100", name: "Mission Master", description: "Complete 100 missions", icon: "💯", category: "combat", requiredMissions: 100, rewardXp: 1000, badgeId: "legendary_hunter" },
  { id: "treasure_hunter", name: "Treasure Hunter", description: "Open 10 treasure chests", icon: "📦", category: "exploration", rewardCurrency: { diamonds: 5 } },
  { id: "explorer", name: "Explorer", description: "Reach reputation level 5", icon: "🧭", category: "exploration", badgeId: "early_explorer" },
  { id: "legend", name: "Legend", description: "Reach global level 50", icon: "🏆", category: "legend", requiredLevel: 50, badgeId: "legendary" },
  { id: "mythic_hero", name: "Mythic Hero", description: "Reach global level 75", icon: "✨", category: "legend", requiredLevel: 75, badgeId: "mythic" },
];

export const BADGES: IBadgeDefinition[] = [
  { id: "bronze_explorer", name: "Bronze Explorer", description: "Completed first mission", icon: "🥉", tier: "bronze", rarity: "common" },
  { id: "silver_pathfinder", name: "Silver Pathfinder", description: "Reached level 10", icon: "🥈", tier: "silver", rarity: "rare" },
  { id: "gold_vanguard", name: "Gold Vanguard", description: "Elite portal warrior", icon: "🥇", tier: "gold", rarity: "epic" },
  { id: "diamond_warden", name: "Diamond Warden", description: "Master of dimensions", icon: "💠", tier: "diamond", rarity: "legendary" },
  { id: "legendary_hunter", name: "Legendary Hunter", description: "100 missions completed", icon: "🏹", tier: "legendary", rarity: "legendary" },
  { id: "mythic", name: "Mythic Hero", description: "Transcended the portal", icon: "✨", tier: "mythic", rarity: "mythic" },
  { id: "founder", name: "Founder", description: "Among the first 1M explorers", icon: "👑", tier: "founder", rarity: "mythic" },
  { id: "early_explorer", name: "Early Explorer", description: "Pioneer of new worlds", icon: "🌟", tier: "earlyExplorer", rarity: "epic" },
  { id: "vip", name: "VIP", description: "Elite portal member", icon: "💫", tier: "vip", rarity: "legendary" },
];

export const TREASURE_CHESTS: ITreasureChestDefinition[] = [
  {
    id: "hidden_treasure",
    type: "hidden",
    name: "Hidden Treasure",
    description: "A mysterious cache found while exploring",
    icon: "🎁",
    requiredLevel: 1,
    lootTable: [
      { weight: 50, xp: 15, currency: { bronze: 50 } },
      { weight: 30, currency: { silver: 5 } },
      { weight: 15, currency: { diamonds: 1 } },
      { weight: 5, xp: 50, currency: { gold: 1 } },
    ],
  },
  {
    id: "epic_chest",
    type: "epic",
    name: "Epic Chest",
    description: "Purple-glowing chest of epic loot",
    icon: "📦",
    requiredLevel: 5,
    cost: { portalEnergy: 20 },
    lootTable: [
      { weight: 40, xp: 75, currency: { silver: 25 } },
      { weight: 35, currency: { diamonds: 3, crystals: 2 } },
      { weight: 20, xp: 100, currency: { gold: 2 } },
      { weight: 5, badgeId: "gold_vanguard" },
    ],
  },
  {
    id: "legendary_chest",
    type: "legendary",
    name: "Legendary Chest",
    description: "Forged in the heart of the portal",
    icon: "🏆",
    requiredLevel: 15,
    cost: { portalEnergy: 40, legendTokens: 1 },
    lootTable: [
      { weight: 35, xp: 200, currency: { gold: 10, diamonds: 5 } },
      { weight: 35, currency: { legendTokens: 2, crystals: 10 } },
      { weight: 20, achievementId: "treasure_hunter" },
      { weight: 10, badgeId: "diamond_warden" },
    ],
  },
  {
    id: "mythic_chest",
    type: "mythic",
    name: "Mythic Chest",
    description: "Reality-bending rewards await within",
    icon: "✨",
    requiredLevel: 30,
    cost: { portalEnergy: 60, mythicCoins: 1 },
    lootTable: [
      { weight: 40, xp: 500, currency: { mythicCoins: 2, diamonds: 15 } },
      { weight: 30, badgeId: "mythic" },
      { weight: 20, currency: { legendTokens: 5 } },
      { weight: 10, achievementId: "legend" },
    ],
  },
  {
    id: "quantum_chest",
    type: "quantum",
    name: "Quantum Chest",
    description: "Exists across all dimensions simultaneously",
    icon: "🌀",
    requiredLevel: 50,
    cost: { portalEnergy: 100, mythicCoins: 3 },
    lootTable: [
      { weight: 50, xp: 1000, currency: { mythicCoins: 5, diamonds: 25 } },
      { weight: 30, badgeId: "founder" },
      { weight: 20, achievementId: "mythic_hero" },
    ],
  },
];

export const GAME_EVENTS: IGameEventDefinition[] = [
  {
    id: "daily_portal_rush",
    type: "daily",
    title: "Daily Portal Rush",
    description: "Complete 3 missions for bonus rewards",
    icon: "☀️",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(),
    rewards: { bronze: 100, xp: 50 },
    isActive: true,
  },
  {
    id: "weekly_dimension_siege",
    type: "weekly",
    title: "Weekly Dimension Siege",
    description: "Team up and conquer weekly challenges",
    icon: "🗓️",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    rewards: { silver: 50, diamonds: 3, xp: 200 },
    isActive: true,
  },
  {
    id: "monthly_legend_hunt",
    type: "monthly",
    title: "Monthly Legend Hunt",
    description: "Hunt legendary treasures across all worlds",
    icon: "🌙",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    rewards: { gold: 10, legendTokens: 2 },
    isActive: true,
  },
  {
    id: "global_portal_storm",
    type: "global",
    title: "Global Portal Storm",
    description: "Server-wide event — all explorers earn 2x XP",
    icon: "🌍",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    rewards: { xp: 500 },
    isActive: true,
  },
  {
    id: "season_pass_s1",
    type: "seasonPass",
    title: "Season 1: Void Genesis",
    description: "Earn season pass tiers and exclusive rewards",
    icon: "🎫",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 90 * 86400000).toISOString(),
    rewards: { mythicCoins: 1, legendTokens: 5 },
    isActive: true,
  },
];

const LIVE_REWARD_POOL: Omit<ILiveReward, "id">[] = [
  { kind: "xp", title: "+15 XP", message: "Portal energy absorbed", icon: "⚡", xp: 15, stat: "global", statXp: 15 },
  { kind: "currency", title: "+50 Bronze", message: "Loose coins found", icon: "🟤", currency: { bronze: 50 } },
  { kind: "currency", title: "+3 Diamonds", message: "Gem shard discovered", icon: "💎", currency: { diamonds: 3 }, rarity: "rare" },
  { kind: "treasure", title: "Treasure Found!", message: "A hidden cache appeared", icon: "🎁", chestType: "hidden", rarity: "epic" },
  { kind: "achievement", title: "Achievement Unlocked", message: "Explorer milestone reached", icon: "🏅", achievementId: "explorer", rarity: "legendary" },
  { kind: "daily_reward", title: "Daily Reward Ready", message: "Claim your daily bonus", icon: "☀️", currency: { bronze: 25, portalEnergy: 10 } },
  { kind: "currency", title: "+2 Crystal Shards", message: "Cosmic residue collected", icon: "🔮", currency: { crystals: 2 } },
  { kind: "stat_level_up", title: "Luck Increased", message: "+10 Luck XP", icon: "🍀", stat: "luck", statXp: 10 },
];

/** Roll a random live reward while browsing */
export function rollLiveReward(seed?: number): ILiveReward {
  const idx = seed !== undefined
    ? Math.abs(seed) % LIVE_REWARD_POOL.length
    : Math.floor(Math.random() * LIVE_REWARD_POOL.length);
  const template = LIVE_REWARD_POOL[idx];
  return {
    ...template,
    id: `lr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

/** Weighted loot roll from chest */
export function rollChestLoot(chest: ITreasureChestDefinition): ITreasureChestDefinition["lootTable"][0] {
  const total = chest.lootTable.reduce((s, l) => s + l.weight, 0);
  let roll = Math.random() * total;
  for (const entry of chest.lootTable) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return chest.lootTable[0];
}

export function getBadgeById(id: string): IBadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id);
}

export function getAchievementById(id: string): IAchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getChestById(id: string): ITreasureChestDefinition | undefined {
  return TREASURE_CHESTS.find((c) => c.id === id);
}

export const BADGE_TIER_COLORS: Record<BadgeTier, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#fbbf24",
  diamond: "#60a5fa",
  legendary: "#a855f7",
  mythic: "#e879f9",
  founder: "#f97316",
  earlyExplorer: "#4ade80",
  vip: "#d4af37",
};
