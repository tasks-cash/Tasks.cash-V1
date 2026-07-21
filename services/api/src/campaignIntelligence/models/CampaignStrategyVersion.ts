import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  tenantField,
} from "../../domain/shared/baseSchema";
import { STRATEGY_VERSION_STATUSES, type StrategyVersionStatus } from "../constants";

/**
 * Immutable campaign strategy snapshot — never overwrite an existing version.
 */
export interface ICampaignStrategyVersion extends Document {
  strategyVersionId: string;
  campaignId: string;
  tenantId: string;
  appKey: string;
  version: number;
  status: StrategyVersionStatus;
  inputSnapshot?: Record<string, unknown>;
  campaignSummary?: string;
  objectiveAnalysis?: Record<string, unknown>;
  audienceAnalysis?: Record<string, unknown>;
  marketContext?: Record<string, unknown>;
  positioning?: Record<string, unknown>;
  messagePillars?: unknown[];
  hooks?: unknown[];
  objectionsAndResponses?: unknown[];
  funnelStrategy?: Record<string, unknown>;
  channelStrategy?: Record<string, unknown>;
  languageStrategy?: Record<string, unknown>;
  contentPlan?: Record<string, unknown>;
  experimentationPlan?: Record<string, unknown>;
  measurementPlan?: Record<string, unknown>;
  risks?: unknown[];
  complianceNotes?: string[];
  modelMetadata?: Record<string, unknown>;
  promptVersion?: string;
  generatedByJobId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICampaignStrategyVersion>(
  {
    strategyVersionId: publicIdField("strategyVersion"),
    campaignId: { type: String, required: true, trim: true, immutable: true },
    tenantId: tenantField,
    appKey: appKeyField,
    version: { type: Number, required: true, min: 1, immutable: true },
    status: {
      type: String,
      enum: STRATEGY_VERSION_STATUSES,
      default: "completed",
      required: true,
    },
    inputSnapshot: { type: Schema.Types.Mixed, default: undefined },
    campaignSummary: { type: String, trim: true, maxlength: 20_000, default: undefined },
    objectiveAnalysis: { type: Schema.Types.Mixed, default: undefined },
    audienceAnalysis: { type: Schema.Types.Mixed, default: undefined },
    marketContext: { type: Schema.Types.Mixed, default: undefined },
    positioning: { type: Schema.Types.Mixed, default: undefined },
    messagePillars: { type: [Schema.Types.Mixed], default: undefined },
    hooks: { type: [Schema.Types.Mixed], default: undefined },
    objectionsAndResponses: { type: [Schema.Types.Mixed], default: undefined },
    funnelStrategy: { type: Schema.Types.Mixed, default: undefined },
    channelStrategy: { type: Schema.Types.Mixed, default: undefined },
    languageStrategy: { type: Schema.Types.Mixed, default: undefined },
    contentPlan: { type: Schema.Types.Mixed, default: undefined },
    experimentationPlan: { type: Schema.Types.Mixed, default: undefined },
    measurementPlan: { type: Schema.Types.Mixed, default: undefined },
    risks: { type: [Schema.Types.Mixed], default: undefined },
    complianceNotes: {
      type: [{ type: String, trim: true, maxlength: 2_000 }],
      default: undefined,
    },
    modelMetadata: { type: Schema.Types.Mixed, default: undefined },
    promptVersion: { type: String, trim: true, maxlength: 64, default: undefined },
    generatedByJobId: { type: String, trim: true, maxlength: 128, default: undefined },
    createdBy: { type: String, trim: true, maxlength: 128, default: undefined },
  },
  {
    ...domainSchemaOptions("campaign_strategy_versions"),
    // `version` is the immutable strategy revision number, not OCC.
    versionKey: false,
    optimisticConcurrency: false,
  }
);

schema.pre("save", function (next) {
  if (!this.isNew) {
    next(new Error("CampaignStrategyVersion documents are immutable"));
    return;
  }
  next();
});

schema.pre(["updateOne", "findOneAndUpdate", "updateMany", "replaceOne"], function (next) {
  next(new Error("CampaignStrategyVersion documents are immutable"));
});

schema.index({ tenantId: 1, strategyVersionId: 1 }, { unique: true });
schema.index({ tenantId: 1, campaignId: 1, version: 1 }, { unique: true });
schema.index({ tenantId: 1, campaignId: 1, createdAt: -1 });
schema.index(
  { tenantId: 1, generatedByJobId: 1 },
  { unique: true, partialFilterExpression: { generatedByJobId: { $type: "string" } } }
);

export const CampaignStrategyVersion =
  (mongoose.models.CampaignStrategyVersion as mongoose.Model<ICampaignStrategyVersion>) ??
  mongoose.model<ICampaignStrategyVersion>("CampaignStrategyVersion", schema);
