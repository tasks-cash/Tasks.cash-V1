import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  idempotencyKeyField,
  metadataField,
  tenantField,
  timezoneField,
} from "../../domain/shared/baseSchema";
import {
  CHANNELS,
  FUNNEL_STAGES,
  GENERATION_STATUSES,
  INTEL_CAMPAIGN_STATUSES,
  LANGUAGES,
  type Channel,
  type FunnelStage,
  type GenerationStatus,
  type IntelCampaignStatus,
} from "../constants";

export interface IIntelCampaign extends Document {
  campaignId: string;
  tenantId: string;
  appKey: string;
  name: string;
  internalDescription?: string;
  objective: string;
  status: IntelCampaignStatus;
  sourceType: string;
  productOrService: string;
  brandProfileId?: string;
  audienceProfileId?: string;
  offer?: string;
  funnelStage: FunnelStage;
  primaryLanguage: (typeof LANGUAGES)[number];
  requestedLanguages: (typeof LANGUAGES)[number][];
  requestedChannels: Channel[];
  campaignStartAt?: Date;
  campaignEndAt?: Date;
  timezone: string;
  marketCountries: string[];
  currentStrategyVersion?: number;
  currentPackageVersion?: number;
  generationStatus: GenerationStatus;
  lastGenerationJobId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  archivedAt?: Date;
  archivedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IIntelCampaign>(
  {
    campaignId: publicIdField("intelCampaign"),
    tenantId: tenantField,
    appKey: appKeyField,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    internalDescription: { type: String, trim: true, maxlength: 5_000, default: undefined },
    objective: { type: String, required: true, trim: true, maxlength: 2_000 },
    status: {
      type: String,
      enum: INTEL_CAMPAIGN_STATUSES,
      default: "draft",
      required: true,
    },
    sourceType: { type: String, required: true, trim: true, lowercase: true, maxlength: 64 },
    productOrService: { type: String, required: true, trim: true, maxlength: 500 },
    brandProfileId: { type: String, trim: true, default: undefined },
    audienceProfileId: { type: String, trim: true, default: undefined },
    offer: { type: String, trim: true, maxlength: 1_000, default: undefined },
    funnelStage: { type: String, enum: FUNNEL_STAGES, required: true },
    primaryLanguage: { type: String, enum: LANGUAGES, required: true, default: "en" },
    requestedLanguages: {
      type: [{ type: String, enum: LANGUAGES }],
      default: ["en"],
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 10,
        message: "requestedLanguages: 1–10 entries required",
      },
    },
    requestedChannels: {
      type: [{ type: String, enum: CHANNELS }],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 20,
        message: "requestedChannels: max 20 entries",
      },
    },
    campaignStartAt: { type: Date, default: undefined },
    campaignEndAt: { type: Date, default: undefined },
    timezone: timezoneField,
    marketCountries: {
      type: [{ type: String, trim: true, uppercase: true, match: /^[A-Z]{2}$/ }],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 50,
        message: "marketCountries: max 50 entries",
      },
    },
    currentStrategyVersion: { type: Number, min: 1, default: undefined },
    currentPackageVersion: { type: Number, min: 1, default: undefined },
    generationStatus: {
      type: String,
      enum: GENERATION_STATUSES,
      default: "idle",
      required: true,
    },
    lastGenerationJobId: { type: String, trim: true, maxlength: 128, default: undefined },
    idempotencyKey: idempotencyKeyField,
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("intel_campaigns")
);

schema.pre("validate", function (this: IIntelCampaign, next) {
  if (this.campaignStartAt && this.campaignEndAt && this.campaignEndAt <= this.campaignStartAt) {
    next(new Error("IntelCampaign campaignEndAt must be after campaignStartAt"));
    return;
  }
  next();
});

schema.index({ tenantId: 1, campaignId: 1 }, { unique: true });
schema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);
schema.index({ tenantId: 1, status: 1 });
schema.index({ tenantId: 1, createdAt: -1 });

export const IntelCampaign =
  (mongoose.models.IntelCampaign as mongoose.Model<IIntelCampaign>) ??
  mongoose.model<IIntelCampaign>("IntelCampaign", schema);
