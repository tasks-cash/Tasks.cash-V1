import mongoose, { Document, Schema } from "mongoose";
import type { UserRole } from "@tasks-cash/types";
import { defaultCurrencies, defaultRPGStats } from "@tasks-cash/utils";

const statSchema = new Schema({ level: { type: Number, default: 1 }, xp: { type: Number, default: 0 } }, { _id: false });

const currenciesSchema = new Schema(
  {
    bronze: { type: Number, default: 500 },
    silver: { type: Number, default: 0 },
    gold: { type: Number, default: 0 },
    diamonds: { type: Number, default: 0 },
    crystals: { type: Number, default: 0 },
    legendTokens: { type: Number, default: 0 },
    mythicCoins: { type: Number, default: 0 },
    portalEnergy: { type: Number, default: 100 },
  },
  { _id: false }
);

const rpgStatsSchema = new Schema(
  {
    global: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    strength: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    intelligence: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    speed: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    luck: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    life: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    energy: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    defense: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
    reputation: { type: statSchema, default: () => ({ level: 1, xp: 0 }) },
  },
  { _id: false }
);

export interface IUserDocument extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  coins: number;
  xp: number;
  level: number;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  avatar?: string;
  badges: string[];
  completedMissions: mongoose.Types.ObjectId[];
  currencies: ReturnType<typeof defaultCurrencies>;
  rpgStats: ReturnType<typeof defaultRPGStats>;
  achievements: Array<{ id: string; unlockedAt: Date }>;
  collectedBadges: Array<{ id: string; earnedAt: Date }>;
  playerTitle: string;
  avatarFrame: string;
  explorerRank: string;
  streakDays: number;
  lastDailyClaim?: Date;
  lastLiveReward?: Date;
  treasuresOpened: number;
  playTimeMinutes: number;
  totalXpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
    coins: { type: Number, default: 100 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    referralCode: { type: String, unique: true },
    referredBy: { type: Schema.Types.ObjectId, ref: "User" },
    avatar: String,
    badges: [{ type: String }],
    completedMissions: [{ type: Schema.Types.ObjectId, ref: "Mission" }],
    currencies: { type: currenciesSchema, default: () => defaultCurrencies() },
    rpgStats: { type: rpgStatsSchema, default: () => defaultRPGStats() },
    achievements: [{ id: String, unlockedAt: { type: Date, default: Date.now } }],
    collectedBadges: [{ id: String, earnedAt: { type: Date, default: Date.now } }],
    playerTitle: { type: String, default: "Portal Initiate" },
    avatarFrame: { type: String, default: "default_gold" },
    explorerRank: { type: String, default: "Portal Initiate" },
    streakDays: { type: Number, default: 0 },
    lastDailyClaim: Date,
    lastLiveReward: Date,
    treasuresOpened: { type: Number, default: 0 },
    playTimeMinutes: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ xp: -1 });
userSchema.index({ coins: -1 });
userSchema.index({ "rpgStats.global.level": -1 });

export const User = mongoose.model<IUserDocument>("User", userSchema);
