import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  auditFields,
  currencyField,
  domainSchemaOptions,
  metadataField,
  moneyField,
  rulesField,
  slugField,
  tagsField,
  tenantField,
  timezoneField,
  urlField,
} from "../shared/baseSchema";
import { CAMPAIGN_STATUSES, VISIBILITIES, type CampaignStatus } from "../shared/lifecycle";

export const CAMPAIGN_TYPES = ["standard", "seasonal", "sponsored", "community", "internal"] as const;

export interface ICampaign extends Document {
  campaignId: string;
  tenantId: string;
  appKey: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  campaignType: (typeof CAMPAIGN_TYPES)[number];
  status: CampaignStatus;
  visibility: (typeof VISIBILITIES)[number];
  startAt?: Date;
  endAt?: Date;
  timezone: string;
  budget: mongoose.Types.Decimal128;
  currency: string;
  rewardBudget: mongoose.Types.Decimal128;
  spentRewardAmount: mongoose.Types.Decimal128;
  participantLimit?: number;
  participationCount: number;
  challengeIds: string[];
  audienceRules?: Record<string, unknown>;
  eligibilityRules?: Record<string, unknown>;
  targeting?: Record<string, unknown>;
  languages: string[];
  featuredImage?: string;
  bannerImage?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  publishedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
  archivedAt?: Date;
  archivedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICampaign>(
  {
    campaignId: publicIdField("campaign"),
    tenantId: tenantField,
    appKey: appKeyField,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: slugField,
    description: { type: String, trim: true, maxlength: 10_000 },
    shortDescription: { type: String, trim: true, maxlength: 400 },
    campaignType: { type: String, enum: CAMPAIGN_TYPES, default: "standard", required: true },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: "draft", required: true },
    visibility: { type: String, enum: VISIBILITIES, default: "private", required: true },
    startAt: { type: Date, default: undefined },
    endAt: { type: Date, default: undefined },
    timezone: timezoneField,
    budget: moneyField,
    currency: currencyField,
    rewardBudget: moneyField,
    spentRewardAmount: moneyField,
    participantLimit: { type: Number, min: 1, default: undefined },
    participationCount: { type: Number, min: 0, default: 0 },
    challengeIds: { type: [String], default: [] },
    audienceRules: rulesField,
    eligibilityRules: rulesField,
    targeting: rulesField,
    languages: { type: [{ type: String, lowercase: true, match: /^[a-z]{2}(-[a-z]{2})?$/ }], default: ["en"] },
    featuredImage: urlField,
    bannerImage: urlField,
    tags: tagsField,
    metadata: metadataField,
    approvedBy: { type: String, trim: true, maxlength: 128, default: undefined },
    approvedAt: { type: Date, default: undefined },
    publishedAt: { type: Date, default: undefined },
    pausedAt: { type: Date, default: undefined },
    completedAt: { type: Date, default: undefined },
    ...auditFields,
  },
  domainSchemaOptions("campaigns")
);

// Date-window sanity: endAt must follow startAt when both are set.
schema.pre("validate", function (this: ICampaign, next) {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    next(new Error("Campaign endAt must be after startAt"));
    return;
  }
  // Lifecycle/date coherence: scheduled/published require a start date.
  if (["scheduled"].includes(this.status) && !this.startAt) {
    next(new Error("Scheduled campaigns require startAt"));
    return;
  }
  next();
});

// Public ID lookup (unique per tenant)
schema.index({ tenantId: 1, campaignId: 1 }, { unique: true });
// Slug uniqueness per tenant+app (soft-deleted docs excluded — use null match for older Mongo)
schema.index(
  { tenantId: 1, appKey: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null }, name: "uniq_campaign_slug_active" }
);
// Status dashboards / lifecycle queries
schema.index({ tenantId: 1, status: 1 });
// Active-window scans (scheduler)
schema.index({ tenantId: 1, startAt: 1, endAt: 1 });
// Recency listings
schema.index({ tenantId: 1, createdAt: -1 });
// Tag discovery
schema.index({ tenantId: 1, tags: 1 });

export const Campaign =
  (mongoose.models.Campaign as mongoose.Model<ICampaign>) ??
  mongoose.model<ICampaign>("Campaign", schema);
