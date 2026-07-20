import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  currencyField,
  domainSchemaOptions,
  idempotencyKeyField,
  metadataField,
  moneyField,
  rulesField,
  tenantField,
} from "../shared/baseSchema";
import { REWARD_STATUSES, type RewardStatus } from "../shared/lifecycle";

export const REWARD_TYPES = ["cash", "points", "xp", "badge", "item", "custom"] as const;

export interface IDomainReward extends Document {
  rewardId: string;
  tenantId: string;
  appKey: string;
  campaignId?: string;
  challengeId?: string;
  missionId?: string;
  submissionId?: string;
  userId: mongoose.Types.ObjectId;
  rewardType: (typeof REWARD_TYPES)[number];
  status: RewardStatus;
  amount: mongoose.Types.Decimal128;
  currency: string;
  points: number;
  xp: number;
  badgeId?: string;
  calculation?: Record<string, unknown>;
  issuedAt?: Date;
  claimedAt?: Date;
  expiresAt?: Date;
  reversedAt?: Date;
  reversalReason?: string;
  walletTransactionId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDomainReward>(
  {
    rewardId: publicIdField("reward"),
    tenantId: tenantField,
    appKey: appKeyField,
    campaignId: { type: String, trim: true, default: undefined },
    challengeId: { type: String, trim: true, default: undefined },
    missionId: { type: String, trim: true, default: undefined },
    submissionId: { type: String, trim: true, default: undefined },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rewardType: { type: String, enum: REWARD_TYPES, required: true },
    status: { type: String, enum: REWARD_STATUSES, default: "pending", required: true },
    amount: moneyField,
    currency: currencyField,
    points: { type: Number, min: 0, default: 0 },
    xp: { type: Number, min: 0, default: 0 },
    badgeId: { type: String, trim: true, default: undefined },
    // Server-side calculation trace (rule id, inputs, computed result).
    calculation: rulesField,
    issuedAt: { type: Date, default: undefined },
    claimedAt: { type: Date, default: undefined },
    expiresAt: { type: Date, default: undefined },
    reversedAt: { type: Date, default: undefined },
    reversalReason: { type: String, trim: true, maxlength: 2_000, default: undefined },
    walletTransactionId: { type: String, trim: true, default: undefined },
    idempotencyKey: idempotencyKeyField,
    metadata: metadataField,
    createdBy: { type: String, trim: true, maxlength: 128, default: undefined },
  },
  domainSchemaOptions("domain_rewards")
);

schema.index({ tenantId: 1, rewardId: 1 }, { unique: true });
// Duplicate-issuance guard: one reward per idempotency key per tenant.
schema.index(
  { tenantId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $exists: true } },
    name: "uniq_reward_idempotency",
  }
);
// One reward per submission (when submission-linked and still live)
schema.index(
  { tenantId: 1, submissionId: 1 },
  {
    unique: true,
    // $nin is not valid in partialFilterExpression on many Mongo versions —
    // enumerate active statuses with $in instead.
    partialFilterExpression: {
      submissionId: { $type: "string" },
      status: { $in: ["pending", "approved", "issued", "claimed"] },
    },
    name: "uniq_reward_per_submission",
  }
);
schema.index({ tenantId: 1, userId: 1, createdAt: -1 });
schema.index({ tenantId: 1, status: 1, expiresAt: 1 });
schema.index({ tenantId: 1, campaignId: 1, status: 1 });

export const DomainReward =
  (mongoose.models.DomainReward as mongoose.Model<IDomainReward>) ??
  mongoose.model<IDomainReward>("DomainReward", schema);
