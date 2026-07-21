import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  metadataField,
  tenantField,
} from "../../domain/shared/baseSchema";
import {
  ASSET_TYPES,
  CHANNELS,
  LANGUAGES,
  LOCALES,
  LOCALIZATION_METHODS,
  VALIDATION_STATUSES,
  VARIANTS,
  type AssetType,
  type Channel,
  type LocalizationMethod,
  type ValidationStatus,
} from "../constants";

export interface ICampaignAsset extends Document {
  assetId: string;
  campaignId: string;
  tenantId: string;
  appKey: string;
  packageVersionId: string;
  strategyVersionId: string;
  language: (typeof LANGUAGES)[number];
  locale: (typeof LOCALES)[number];
  channel: Channel;
  assetType: AssetType;
  variant: (typeof VARIANTS)[number];
  title?: string;
  hook?: string;
  body?: string;
  callToAction?: string;
  description?: string;
  hashtags: string[];
  keywords: string[];
  script?: string;
  shotList?: unknown[];
  captions?: string;
  thumbnailBrief?: string;
  visualBrief?: string;
  audioBrief?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  publishingRecommendations: string[];
  complianceNotes: string[];
  sourceLanguage?: (typeof LANGUAGES)[number];
  localizationMethod?: LocalizationMethod;
  qualityScore?: number;
  validationStatus: ValidationStatus;
  validationErrors: string[];
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICampaignAsset>(
  {
    assetId: publicIdField("campaignAsset"),
    campaignId: { type: String, required: true, trim: true, index: true },
    tenantId: tenantField,
    appKey: appKeyField,
    packageVersionId: { type: String, required: true, trim: true, index: true },
    strategyVersionId: { type: String, required: true, trim: true },
    language: { type: String, enum: LANGUAGES, required: true },
    locale: { type: String, enum: LOCALES, required: true },
    channel: { type: String, enum: CHANNELS, required: true },
    assetType: { type: String, enum: ASSET_TYPES, required: true },
    variant: { type: String, enum: VARIANTS, required: true, default: "balanced" },
    title: { type: String, trim: true, maxlength: 500, default: undefined },
    hook: { type: String, trim: true, maxlength: 2_000, default: undefined },
    body: { type: String, trim: true, maxlength: 50_000, default: undefined },
    callToAction: { type: String, trim: true, maxlength: 500, default: undefined },
    description: { type: String, trim: true, maxlength: 5_000, default: undefined },
    hashtags: {
      type: [{ type: String, trim: true, maxlength: 100 }],
      default: [],
    },
    keywords: {
      type: [{ type: String, trim: true, maxlength: 100 }],
      default: [],
    },
    script: { type: String, trim: true, maxlength: 50_000, default: undefined },
    shotList: { type: [Schema.Types.Mixed], default: undefined },
    captions: { type: String, trim: true, maxlength: 10_000, default: undefined },
    thumbnailBrief: { type: String, trim: true, maxlength: 5_000, default: undefined },
    visualBrief: { type: String, trim: true, maxlength: 5_000, default: undefined },
    audioBrief: { type: String, trim: true, maxlength: 5_000, default: undefined },
    durationSeconds: { type: Number, min: 0, max: 86_400, default: undefined },
    aspectRatio: { type: String, trim: true, maxlength: 16, default: undefined },
    publishingRecommendations: {
      type: [{ type: String, trim: true, maxlength: 1_000 }],
      default: [],
    },
    complianceNotes: {
      type: [{ type: String, trim: true, maxlength: 2_000 }],
      default: [],
    },
    sourceLanguage: { type: String, enum: LANGUAGES, default: undefined },
    localizationMethod: { type: String, enum: LOCALIZATION_METHODS, default: undefined },
    qualityScore: { type: Number, min: 0, max: 100, default: undefined },
    validationStatus: {
      type: String,
      enum: VALIDATION_STATUSES,
      default: "pending",
      required: true,
    },
    validationErrors: {
      type: [{ type: String, trim: true, maxlength: 1_000 }],
      default: [],
    },
    metadata: metadataField,
  },
  domainSchemaOptions("campaign_assets")
);

schema.pre("save", function (next) {
  if (!this.isNew) return next(new Error("CampaignAsset documents are immutable"));
  next();
});
schema.pre(["updateOne", "findOneAndUpdate", "updateMany", "replaceOne"], function (next) {
  next(new Error("CampaignAsset documents are immutable"));
});

schema.index({ tenantId: 1, assetId: 1 }, { unique: true });
schema.index({ tenantId: 1, campaignId: 1, packageVersionId: 1 });
schema.index(
  { tenantId: 1, packageVersionId: 1, language: 1, channel: 1, variant: 1, assetType: 1 },
  { unique: true, name: "uq_campaign_asset_variant" }
);
schema.index({ tenantId: 1, language: 1 });
schema.index({ tenantId: 1, channel: 1 });

export const CampaignAsset =
  (mongoose.models.CampaignAsset as mongoose.Model<ICampaignAsset>) ??
  mongoose.model<ICampaignAsset>("CampaignAsset", schema);
