import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  tenantField,
} from "../../domain/shared/baseSchema";
import { CHANNELS, LANGUAGES, PACKAGE_VERSION_STATUSES, type PackageVersionStatus } from "../constants";

/**
 * Immutable generated package snapshot — never overwrite an existing version.
 */
export interface ICampaignPackageVersion extends Document {
  packageVersionId: string;
  campaignId: string;
  tenantId: string;
  appKey: string;
  strategyVersionId: string;
  version: number;
  status: PackageVersionStatus;
  languages: (typeof LANGUAGES)[number][];
  channels: (typeof CHANNELS)[number][];
  assets?: unknown[];
  generationSummary?: Record<string, unknown>;
  modelMetadata?: Record<string, unknown>;
  promptVersion?: string;
  generatedByJobId?: string;
  validationResults?: Record<string, unknown>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ICampaignPackageVersion>(
  {
    packageVersionId: publicIdField("packageVersion"),
    campaignId: { type: String, required: true, trim: true, immutable: true },
    tenantId: tenantField,
    appKey: appKeyField,
    strategyVersionId: { type: String, required: true, trim: true, immutable: true },
    version: { type: Number, required: true, min: 1, immutable: true },
    status: {
      type: String,
      enum: PACKAGE_VERSION_STATUSES,
      default: "ready",
      required: true,
    },
    languages: {
      type: [{ type: String, enum: LANGUAGES }],
      default: [],
    },
    channels: {
      type: [{ type: String, enum: CHANNELS }],
      default: [],
    },
    assets: { type: [Schema.Types.Mixed], default: undefined },
    generationSummary: { type: Schema.Types.Mixed, default: undefined },
    modelMetadata: { type: Schema.Types.Mixed, default: undefined },
    promptVersion: { type: String, trim: true, maxlength: 64, default: undefined },
    generatedByJobId: { type: String, trim: true, maxlength: 128, default: undefined },
    validationResults: { type: Schema.Types.Mixed, default: undefined },
    createdBy: { type: String, trim: true, maxlength: 128, default: undefined },
  },
  {
    ...domainSchemaOptions("campaign_package_versions"),
    // `version` is the immutable package revision number, not OCC.
    versionKey: false,
    optimisticConcurrency: false,
  }
);

schema.pre("save", function (next) {
  if (!this.isNew) {
    next(new Error("CampaignPackageVersion documents are immutable"));
    return;
  }
  next();
});

// The only legal mutation is the one-time generating → terminal finalization.
schema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
  const filter = this.getFilter() as Record<string, unknown>;
  const update = this.getUpdate() as Record<string, any> | null;
  const set = update?.$set as Record<string, unknown> | undefined;
  const allowed = new Set(["status", "assets", "validationResults", "generationSummary", "updatedAt"]);
  if (filter.status !== "generating" || !set || Object.keys(set).some((key) => !allowed.has(key))) {
    next(new Error("CampaignPackageVersion documents are immutable after finalization"));
    return;
  }
  next();
});
schema.pre("replaceOne", function (next) {
  next(new Error("CampaignPackageVersion replace is not allowed"));
});

schema.index({ tenantId: 1, packageVersionId: 1 }, { unique: true });
schema.index({ tenantId: 1, campaignId: 1, version: 1 }, { unique: true });
schema.index({ tenantId: 1, campaignId: 1, createdAt: -1 });
schema.index({ tenantId: 1, strategyVersionId: 1 });
schema.index(
  { tenantId: 1, generatedByJobId: 1 },
  { unique: true, partialFilterExpression: { generatedByJobId: { $type: "string" } } }
);

export const CampaignPackageVersion =
  (mongoose.models.CampaignPackageVersion as mongoose.Model<ICampaignPackageVersion>) ??
  mongoose.model<ICampaignPackageVersion>("CampaignPackageVersion", schema);
