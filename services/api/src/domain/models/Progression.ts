import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  metadataField,
  rulesField,
  tenantField,
  urlField,
} from "../shared/baseSchema";

/* ─────────────── UserProgress ─────────────── */

export interface IUserProgress extends Document {
  progressId: string;
  tenantId: string;
  appKey: string;
  userId: mongoose.Types.ObjectId;
  xp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt?: Date;
  seasonId?: string;
  /** Counters used by achievement tracking (bounded object). */
  counters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const progressSchema = new Schema<IUserProgress>(
  {
    progressId: publicIdField("userProgress"),
    tenantId: tenantField,
    appKey: appKeyField,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    xp: { type: Number, min: 0, default: 0 },
    currentLevel: { type: Number, min: 0, default: 0 },
    currentStreak: { type: Number, min: 0, default: 0 },
    longestStreak: { type: Number, min: 0, default: 0 },
    lastActivityAt: { type: Date, default: undefined },
    seasonId: { type: String, trim: true, default: undefined },
    counters: rulesField,
    metadata: metadataField,
  },
  domainSchemaOptions("user_progress")
);

// One progress doc per user per app per tenant (award history lives in
// UserBadge/UserAchievement — never inside this document).
progressSchema.index({ tenantId: 1, appKey: 1, userId: 1 }, { unique: true, name: "uniq_progress_user" });
progressSchema.index({ tenantId: 1, seasonId: 1, xp: -1 });

export const UserProgress =
  (mongoose.models.UserProgress as mongoose.Model<IUserProgress>) ??
  mongoose.model<IUserProgress>("UserProgress", progressSchema);

/* ─────────────── LevelDefinition ─────────────── */

export interface ILevelDefinition extends Document {
  levelId: string;
  tenantId: string;
  appKey: string;
  level: number;
  name: string;
  xpRequired: number;
  rewards?: Record<string, unknown>;
  icon?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  version: number;
}

const levelSchema = new Schema<ILevelDefinition>(
  {
    levelId: publicIdField("levelDefinition"),
    tenantId: tenantField,
    appKey: appKeyField,
    level: { type: Number, min: 0, required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    xpRequired: { type: Number, min: 0, required: true },
    rewards: rulesField,
    icon: urlField,
    isActive: { type: Boolean, default: true },
    metadata: metadataField,
  },
  domainSchemaOptions("level_definitions")
);

levelSchema.index({ tenantId: 1, appKey: 1, level: 1 }, { unique: true, name: "uniq_level_number" });
levelSchema.index({ tenantId: 1, levelId: 1 }, { unique: true });

export const LevelDefinition =
  (mongoose.models.LevelDefinition as mongoose.Model<ILevelDefinition>) ??
  mongoose.model<ILevelDefinition>("LevelDefinition", levelSchema);

/* ─────────────── Badge / UserBadge ─────────────── */

export interface IBadge extends Document {
  badgeId: string;
  tenantId: string;
  appKey: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  rarity: string;
  isSystemBadge: boolean;
  isActive: boolean;
  criteria?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

const badgeSchema = new Schema<IBadge>(
  {
    badgeId: publicIdField("badge"),
    tenantId: tenantField,
    appKey: appKeyField,
    slug: { type: String, required: true, trim: true, lowercase: true, match: /^[a-z0-9][a-z0-9-]{0,96}$/ },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2_000 },
    icon: urlField,
    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "epic", "legendary"],
      default: "common",
    },
    isSystemBadge: { type: Boolean, default: false, immutable: true },
    isActive: { type: Boolean, default: true },
    criteria: rulesField,
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("badges")
);

badgeSchema.index({ tenantId: 1, badgeId: 1 }, { unique: true });
badgeSchema.index({ tenantId: 1, appKey: 1, slug: 1 }, { unique: true, name: "uniq_badge_slug" });

export const Badge =
  (mongoose.models.Badge as mongoose.Model<IBadge>) ?? mongoose.model<IBadge>("Badge", badgeSchema);

export interface IUserBadge extends Document {
  tenantId: string;
  appKey: string;
  userId: mongoose.Types.ObjectId;
  badgeId: string;
  awardedAt: Date;
  awardedBy?: string;
  sourceType?: string;
  sourceId?: string;
  metadata?: Record<string, unknown>;
}

const userBadgeSchema = new Schema<IUserBadge>(
  {
    tenantId: tenantField,
    appKey: appKeyField,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    badgeId: { type: String, required: true, trim: true },
    awardedAt: { type: Date, required: true, default: () => new Date() },
    awardedBy: { type: String, trim: true, maxlength: 128, default: undefined },
    sourceType: { type: String, trim: true, maxlength: 64, default: undefined },
    sourceId: { type: String, trim: true, maxlength: 128, default: undefined },
    metadata: metadataField,
  },
  domainSchemaOptions("user_badges")
);

// A user can earn each badge only once per tenant/app.
userBadgeSchema.index(
  { tenantId: 1, appKey: 1, userId: 1, badgeId: 1 },
  { unique: true, name: "uniq_user_badge" }
);
userBadgeSchema.index({ tenantId: 1, userId: 1, awardedAt: -1 });

export const UserBadge =
  (mongoose.models.UserBadge as mongoose.Model<IUserBadge>) ??
  mongoose.model<IUserBadge>("UserBadge", userBadgeSchema);

/* ─────────────── Achievement / UserAchievement ─────────────── */

export interface IAchievement extends Document {
  achievementId: string;
  tenantId: string;
  appKey: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  criteria?: Record<string, unknown>;
  rewardRules?: Record<string, unknown>;
  isSystemAchievement: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

const achievementSchema = new Schema<IAchievement>(
  {
    achievementId: publicIdField("achievement"),
    tenantId: tenantField,
    appKey: appKeyField,
    slug: { type: String, required: true, trim: true, lowercase: true, match: /^[a-z0-9][a-z0-9-]{0,96}$/ },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 2_000 },
    icon: urlField,
    criteria: rulesField,
    rewardRules: rulesField,
    isSystemAchievement: { type: Boolean, default: false, immutable: true },
    isActive: { type: Boolean, default: true },
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("achievements")
);

achievementSchema.index({ tenantId: 1, achievementId: 1 }, { unique: true });
achievementSchema.index({ tenantId: 1, appKey: 1, slug: 1 }, { unique: true, name: "uniq_achievement_slug" });

export const Achievement =
  (mongoose.models.Achievement as mongoose.Model<IAchievement>) ??
  mongoose.model<IAchievement>("Achievement", achievementSchema);

export interface IUserAchievement extends Document {
  tenantId: string;
  appKey: string;
  userId: mongoose.Types.ObjectId;
  achievementId: string;
  progress: number;
  target: number;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

const userAchievementSchema = new Schema<IUserAchievement>(
  {
    tenantId: tenantField,
    appKey: appKeyField,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    achievementId: { type: String, required: true, trim: true },
    progress: { type: Number, min: 0, default: 0 },
    target: { type: Number, min: 1, default: 1 },
    completedAt: { type: Date, default: undefined },
    metadata: metadataField,
  },
  domainSchemaOptions("user_achievements")
);

userAchievementSchema.index(
  { tenantId: 1, appKey: 1, userId: 1, achievementId: 1 },
  { unique: true, name: "uniq_user_achievement" }
);
userAchievementSchema.index({ tenantId: 1, userId: 1, completedAt: -1 });

export const UserAchievement =
  (mongoose.models.UserAchievement as mongoose.Model<IUserAchievement>) ??
  mongoose.model<IUserAchievement>("UserAchievement", userAchievementSchema);
