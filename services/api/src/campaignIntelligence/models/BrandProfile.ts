import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  metadataField,
  tenantField,
  urlField,
} from "../../domain/shared/baseSchema";
import { LANGUAGES } from "../constants";

export interface IBrandProfile extends Document {
  brandProfileId: string;
  tenantId: string;
  appKey: string;
  name: string;
  companyDescription?: string;
  products?: unknown[];
  services?: unknown[];
  valuePropositions?: unknown[];
  brandVoice?: Record<string, unknown>;
  toneRules?: Record<string, unknown>;
  forbiddenPhrases: string[];
  preferredTerminology: string[];
  legalDisclaimers?: unknown[];
  complianceRules?: Record<string, unknown>;
  visualGuidelines?: Record<string, unknown>;
  targetMarkets: string[];
  supportedLanguages: (typeof LANGUAGES)[number][];
  website?: string;
  socialProfiles?: Record<string, unknown>;
  competitorNames: string[];
  active: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IBrandProfile>(
  {
    brandProfileId: publicIdField("brandProfile"),
    tenantId: tenantField,
    appKey: appKeyField,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    companyDescription: { type: String, trim: true, maxlength: 10_000, default: undefined },
    products: { type: [Schema.Types.Mixed], default: undefined },
    services: { type: [Schema.Types.Mixed], default: undefined },
    valuePropositions: { type: [Schema.Types.Mixed], default: undefined },
    brandVoice: { type: Schema.Types.Mixed, default: undefined },
    toneRules: { type: Schema.Types.Mixed, default: undefined },
    forbiddenPhrases: {
      type: [{ type: String, trim: true, maxlength: 256 }],
      default: [],
    },
    preferredTerminology: {
      type: [{ type: String, trim: true, maxlength: 256 }],
      default: [],
    },
    legalDisclaimers: { type: [Schema.Types.Mixed], default: undefined },
    complianceRules: { type: Schema.Types.Mixed, default: undefined },
    visualGuidelines: { type: Schema.Types.Mixed, default: undefined },
    targetMarkets: {
      type: [{ type: String, trim: true, uppercase: true, match: /^[A-Z]{2}$/ }],
      default: [],
    },
    supportedLanguages: {
      type: [{ type: String, enum: LANGUAGES }],
      default: ["en"],
    },
    website: urlField,
    socialProfiles: { type: Schema.Types.Mixed, default: undefined },
    competitorNames: {
      type: [{ type: String, trim: true, maxlength: 128 }],
      default: [],
    },
    active: { type: Boolean, default: true },
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("brand_profiles")
);

schema.index({ tenantId: 1, brandProfileId: 1 }, { unique: true });
schema.index({ tenantId: 1, active: 1, name: 1 });
schema.index({ tenantId: 1, createdAt: -1 });

export const BrandProfile =
  (mongoose.models.BrandProfile as mongoose.Model<IBrandProfile>) ??
  mongoose.model<IBrandProfile>("BrandProfile", schema);
