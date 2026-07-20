import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  currencyField,
  domainSchemaOptions,
  metadataField,
  moneyField,
  rulesField,
  tenantField,
} from "../shared/baseSchema";

export const PROGRAM_STATUSES = ["draft", "active", "paused", "completed", "archived"] as const;
export const COMMISSION_TYPES = ["fixed", "percentage", "tiered"] as const;

export interface IReferralProgram extends Document {
  programId: string;
  tenantId: string;
  appKey: string;
  name: string;
  status: (typeof PROGRAM_STATUSES)[number];
  commissionType: (typeof COMMISSION_TYPES)[number];
  commissionValue: mongoose.Types.Decimal128;
  currency: string;
  eligibilityRules?: Record<string, unknown>;
  rewardRules?: Record<string, unknown>;
  startAt?: Date;
  endAt?: Date;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const programSchema = new Schema<IReferralProgram>(
  {
    programId: publicIdField("referralProgram"),
    tenantId: tenantField,
    appKey: appKeyField,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    status: { type: String, enum: PROGRAM_STATUSES, default: "draft", required: true },
    commissionType: { type: String, enum: COMMISSION_TYPES, required: true },
    commissionValue: moneyField,
    currency: currencyField,
    eligibilityRules: rulesField,
    rewardRules: rulesField,
    startAt: { type: Date, default: undefined },
    endAt: { type: Date, default: undefined },
    metadata: metadataField,
    createdBy: { type: String, trim: true, maxlength: 128, default: undefined },
    updatedBy: { type: String, trim: true, maxlength: 128, default: undefined },
  },
  domainSchemaOptions("referral_programs")
);

programSchema.index({ tenantId: 1, programId: 1 }, { unique: true });
programSchema.index({ tenantId: 1, appKey: 1, status: 1 });

export const ReferralProgram =
  (mongoose.models.ReferralProgram as mongoose.Model<IReferralProgram>) ??
  mongoose.model<IReferralProgram>("ReferralProgram", programSchema);

/* ─────────────── Referral ─────────────── */

export const REFERRAL_STATUSES = [
  "pending",
  "qualified",
  "converted",
  "rewarded",
  "rejected",
  "fraud_review",
] as const;

export interface IDomainReferral extends Document {
  referralId: string;
  tenantId: string;
  appKey: string;
  programId?: string;
  referrerUserId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  referralCode: string;
  status: (typeof REFERRAL_STATUSES)[number];
  qualifiedAt?: Date;
  convertedAt?: Date;
  rewardId?: string;
  fraudFlags: string[];
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IDomainReferral>(
  {
    referralId: publicIdField("referral"),
    tenantId: tenantField,
    appKey: appKeyField,
    programId: { type: String, trim: true, default: undefined },
    referrerUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referralCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9_-]{4,32}$/,
    },
    status: { type: String, enum: REFERRAL_STATUSES, default: "pending", required: true },
    qualifiedAt: { type: Date, default: undefined },
    convertedAt: { type: Date, default: undefined },
    rewardId: { type: String, trim: true, default: undefined },
    fraudFlags: { type: [{ type: String, trim: true, maxlength: 64 }], default: [] },
    metadata: metadataField,
  },
  domainSchemaOptions("domain_referrals")
);

/** Self-referral rejection. */
referralSchema.pre("validate", function (this: IDomainReferral, next) {
  if (
    this.referrerUserId &&
    this.referredUserId &&
    this.referrerUserId.toString() === this.referredUserId.toString()
  ) {
    next(new Error("Self-referral is not allowed"));
    return;
  }
  next();
});

referralSchema.index({ tenantId: 1, referralId: 1 }, { unique: true });
// One conversion per referred user per program — blocks duplicated conversion
// and multiple rewards for one conversion.
referralSchema.index(
  { tenantId: 1, programId: 1, referredUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["qualified", "converted", "rewarded"] } },
    name: "uniq_referral_conversion",
  }
);
referralSchema.index({ tenantId: 1, referrerUserId: 1, createdAt: -1 });
referralSchema.index({ tenantId: 1, referralCode: 1 });
referralSchema.index({ tenantId: 1, status: 1 });

export const DomainReferral =
  (mongoose.models.DomainReferral as mongoose.Model<IDomainReferral>) ??
  mongoose.model<IDomainReferral>("DomainReferral", referralSchema);
