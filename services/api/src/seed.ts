import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { User } from "./models/User";
import { Mission } from "./models/Mission";
import { MysteryMission } from "./models/MysteryMission";
import { Reward } from "./models/Reward";
import { generateReferralCode } from "@tasks-cash/utils";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const SEED_MISSIONS = [
  {
    title: "Enter the Portal",
    description: "Complete your first login and step through the dimensional gateway.",
    difficulty: "easy" as const,
    coinReward: 50,
    xpReward: 100,
    category: "onboarding",
  },
  {
    title: "Coin Collector",
    description: "Earn 500 coins from any source to prove your worth.",
    difficulty: "medium" as const,
    coinReward: 100,
    xpReward: 250,
    category: "economy",
  },
  {
    title: "Void Runner",
    description: "Complete 5 missions across the shadow realm.",
    difficulty: "hard" as const,
    coinReward: 300,
    xpReward: 500,
    category: "progression",
  },
  {
    title: "Legend of the Portal",
    description: "Reach level 10 and claim your place among the elite.",
    difficulty: "legendary" as const,
    coinReward: 1000,
    xpReward: 2000,
    category: "legendary",
  },
  {
    title: "Referral Champion",
    description: "Invite 3 allies through your portal link.",
    difficulty: "medium" as const,
    coinReward: 200,
    xpReward: 300,
    category: "social",
  },
];

const SEED_MYSTERY_MISSIONS = [
  {
    title: "Portal Dawn Ritual",
    description: "Complete your daily portal scan before the void resets.",
    difficulty: "easy" as const,
    category: "daily" as const,
    missionType: "daily_login" as const,
    unlockCondition: "none" as const,
    rewards: [{ type: "xp", amount: 100 }, { type: "bronze_coins", amount: 25 }],
    xpReward: 100,
    coinReward: 25,
    coinType: "bronze" as const,
    isHidden: false,
    isFeatured: true,
  },
  {
    title: "Void Whisper Transmission",
    description: "Share the portal broadcast on your social channel.",
    difficulty: "medium" as const,
    category: "social_media" as const,
    missionType: "social_share" as const,
    unlockCondition: "first_mission" as const,
    rewards: [{ type: "silver_coins", amount: 75 }, { type: "xp", amount: 250 }],
    xpReward: 250,
    coinReward: 75,
    coinType: "silver" as const,
    isHidden: true,
    isFeatured: false,
  },
  {
    title: "Founder's Sigil",
    description: "Unlock the legendary founder sigil for first million explorers.",
    difficulty: "legendary" as const,
    category: "founder" as const,
    missionType: "special_event" as const,
    unlockCondition: "founder" as const,
    rewards: [{ type: "founder_badge", amount: 1 }, { type: "legend_tokens", amount: 10 }],
    xpReward: 2000,
    coinReward: 1000,
    coinType: "gold" as const,
    isHidden: true,
    isFeatured: true,
  },
  {
    title: "Chest Triad Ritual",
    description: "Open three treasure chests to awaken the sealed triad mission.",
    difficulty: "epic" as const,
    category: "hidden" as const,
    missionType: "special_event" as const,
    unlockCondition: "open_3_chests" as const,
    rewards: [{ type: "mystery_box", amount: 2 }, { type: "diamond_gems", amount: 10 }],
    xpReward: 1000,
    coinReward: 500,
    coinType: "gold" as const,
    isHidden: true,
    isFeatured: true,
  },
];

const SEED_REWARDS = [
  {
    name: "Portal Initiate Badge",
    description: "Awarded to those who first cross the threshold.",
    type: "badge" as const,
    rarity: "common" as const,
    value: 1,
    requiredLevel: 1,
    requiredCoins: 0,
    icon: "⬡",
  },
  {
    name: "Gold Warden Cloak",
    description: "A shimmering cloak woven from pure portal energy.",
    type: "item" as const,
    rarity: "epic" as const,
    value: 1,
    requiredLevel: 10,
    requiredCoins: 500,
    icon: "🧥",
  },
  {
    name: "Coin Multiplier x1.5",
    description: "Boost all mission coin rewards by 50% for 24 hours.",
    type: "multiplier" as const,
    rarity: "rare" as const,
    value: 1.5,
    requiredLevel: 5,
    requiredCoins: 200,
    icon: "✦",
  },
  {
    name: "Void Crystal",
    description: "A rare crystal pulsing with dimensional energy. Grants 500 XP.",
    type: "xp" as const,
    rarity: "legendary" as const,
    value: 500,
    requiredLevel: 15,
    requiredCoins: 1000,
    icon: "💎",
  },
];

async function seed() {
  await connectDatabase();
  console.log("[Seed] Starting database seed...");

  // Admin user
  const adminExists = await User.findOne({ email: "admin@tasks.cash" });
  if (!adminExists) {
    const hash = await bcrypt.hash("admin123", 12);
    await User.create({
      username: "PortalMaster",
      email: "admin@tasks.cash",
      passwordHash: hash,
      role: "admin",
      coins: 9999,
      xp: 50000,
      level: 50,
      referralCode: generateReferralCode("PortalMaster"),
      badges: ["Portal Master"],
    });
    console.log("[Seed] Admin user created (admin@tasks.cash / admin123)");
  }

  // Demo user
  const demoExists = await User.findOne({ email: "demo@tasks.cash" });
  if (!demoExists) {
    const hash = await bcrypt.hash("demo123", 12);
    await User.create({
      username: "VoidWalker",
      email: "demo@tasks.cash",
      passwordHash: hash,
      coins: 350,
      xp: 750,
      level: 2,
      referralCode: generateReferralCode("VoidWalker"),
    });
    console.log("[Seed] Demo user created (demo@tasks.cash / demo123)");
  }

  // Missions
  const missionCount = await Mission.countDocuments();
  if (missionCount === 0) {
    await Mission.insertMany(SEED_MISSIONS);
    console.log(`[Seed] ${SEED_MISSIONS.length} missions created`);
  }

  // Mystery Missions
  const mysteryCount = await MysteryMission.countDocuments();
  if (mysteryCount === 0) {
    await MysteryMission.insertMany(SEED_MYSTERY_MISSIONS);
    console.log(`[Seed] ${SEED_MYSTERY_MISSIONS.length} mystery missions created`);
  }

  // Rewards
  const rewardCount = await Reward.countDocuments();
  if (rewardCount === 0) {
    await Reward.insertMany(SEED_REWARDS);
    console.log(`[Seed] ${SEED_REWARDS.length} rewards created`);
  }

  console.log("[Seed] Done!");
  await disconnectDatabase();
}

seed().catch((err) => {
  console.error("[Seed] Failed:", err);
  process.exit(1);
});
