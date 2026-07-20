import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  metadataField,
  rulesField,
  tenantField,
  timezoneField,
} from "../shared/baseSchema";
import { SEASON_STATUSES, type SeasonStatus } from "../shared/lifecycle";

/* ─────────────── Season ─────────────── */

export interface ISeason extends Document {
  seasonId: string;
  tenantId: string;
  appKey: string;
  name: string;
  description?: string;
  status: SeasonStatus;
  startAt?: Date;
  endAt?: Date;
  timezone: string;
  scoringRules?: Record<string, unknown>;
  rewardRules?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const seasonSchema = new Schema<ISeason>(
  {
    seasonId: publicIdField("season"),
    tenantId: tenantField,
    appKey: appKeyField,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5_000 },
    status: { type: String, enum: SEASON_STATUSES, default: "draft", required: true },
    startAt: { type: Date, default: undefined },
    endAt: { type: Date, default: undefined },
    timezone: timezoneField,
    scoringRules: rulesField,
    rewardRules: rulesField,
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("seasons")
);

seasonSchema.pre("validate", function (this: ISeason, next) {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    next(new Error("Season endAt must be after startAt"));
    return;
  }
  next();
});

seasonSchema.index({ tenantId: 1, seasonId: 1 }, { unique: true });
seasonSchema.index({ tenantId: 1, appKey: 1, status: 1 });
seasonSchema.index({ tenantId: 1, startAt: 1, endAt: 1 });

export const Season =
  (mongoose.models.Season as mongoose.Model<ISeason>) ??
  mongoose.model<ISeason>("Season", seasonSchema);

/* ─────────────── LeaderboardDefinition ───────────────
 * Live rankings stay in Redis sorted sets; Mongo stores definitions,
 * finalized snapshots, historical results, reward outcomes only.
 */

export const LEADERBOARD_SCOPES = ["global", "app", "season", "campaign", "challenge"] as const;
export const LEADERBOARD_METRICS = ["xp", "points", "earnings", "completions", "referrals", "custom"] as const;
export const LEADERBOARD_PERIODS = ["all_time", "season", "monthly", "weekly", "daily"] as const;
export const LEADERBOARD_STATUSES = ["draft", "active", "paused", "finalized", "archived"] as const;

export interface ILeaderboardDefinition extends Document {
  leaderboardId: string;
  tenantId: string;
  appKey: string;
  seasonId?: string;
  name: string;
  scope: (typeof LEADERBOARD_SCOPES)[number];
  metric: (typeof LEADERBOARD_METRICS)[number];
  period: (typeof LEADERBOARD_PERIODS)[number];
  calculationRules?: Record<string, unknown>;
  eligibilityRules?: Record<string, unknown>;
  status: (typeof LEADERBOARD_STATUSES)[number];
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
}

const definitionSchema = new Schema<ILeaderboardDefinition>(
  {
    leaderboardId: publicIdField("leaderboard"),
    tenantId: tenantField,
    appKey: appKeyField,
    seasonId: { type: String, trim: true, default: undefined },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    scope: { type: String, enum: LEADERBOARD_SCOPES, required: true },
    metric: { type: String, enum: LEADERBOARD_METRICS, required: true },
    period: { type: String, enum: LEADERBOARD_PERIODS, required: true },
    calculationRules: rulesField,
    eligibilityRules: rulesField,
    status: { type: String, enum: LEADERBOARD_STATUSES, default: "draft", required: true },
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("leaderboard_definitions")
);

definitionSchema.index({ tenantId: 1, leaderboardId: 1 }, { unique: true });
definitionSchema.index({ tenantId: 1, appKey: 1, status: 1 });
definitionSchema.index({ tenantId: 1, seasonId: 1 });

export const LeaderboardDefinition =
  (mongoose.models.LeaderboardDefinition as mongoose.Model<ILeaderboardDefinition>) ??
  mongoose.model<ILeaderboardDefinition>("LeaderboardDefinition", definitionSchema);

/* ─────────────── LeaderboardSnapshot ─────────────── */

export interface ILeaderboardSnapshot extends Document {
  snapshotId: string;
  tenantId: string;
  appKey: string;
  leaderboardId: string;
  seasonId?: string;
  periodKey: string;
  isFinal: boolean;
  takenAt: Date;
  entries: Array<{
    rank: number;
    userId: mongoose.Types.ObjectId;
    score: number;
    rewardId?: string;
  }>;
  metadata?: Record<string, unknown>;
}

const snapshotEntrySchema = new Schema(
  {
    rank: { type: Number, min: 1, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    score: { type: Number, required: true },
    rewardId: { type: String, trim: true, default: undefined },
  },
  { _id: false, strict: true }
);

const snapshotSchema = new Schema<ILeaderboardSnapshot>(
  {
    snapshotId: publicIdField("leaderboardSnapshot"),
    tenantId: tenantField,
    appKey: appKeyField,
    leaderboardId: { type: String, required: true, trim: true },
    seasonId: { type: String, trim: true, default: undefined },
    /** e.g. "2026-07" (monthly), "2026-W29" (weekly), "final" */
    periodKey: { type: String, required: true, trim: true, maxlength: 32 },
    isFinal: { type: Boolean, default: false },
    takenAt: { type: Date, required: true, default: () => new Date() },
    entries: {
      type: [snapshotEntrySchema],
      default: [],
      validate: {
        validator: (v: unknown[]) => v.length <= 1_000,
        message: "snapshot entries capped at 1000 rows — page longer boards across snapshots",
      },
    },
    metadata: metadataField,
  },
  domainSchemaOptions("leaderboard_snapshots")
);

snapshotSchema.index({ tenantId: 1, snapshotId: 1 }, { unique: true });
// One snapshot per board+period (re-taking overwrites via upsert in repo)
snapshotSchema.index(
  { tenantId: 1, leaderboardId: 1, periodKey: 1 },
  { unique: true, name: "uniq_snapshot_period" }
);
snapshotSchema.index({ tenantId: 1, leaderboardId: 1, takenAt: -1 });

export const LeaderboardSnapshot =
  (mongoose.models.LeaderboardSnapshot as mongoose.Model<ILeaderboardSnapshot>) ??
  mongoose.model<ILeaderboardSnapshot>("LeaderboardSnapshot", snapshotSchema);
