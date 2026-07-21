import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../../domain/shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  metadataField,
  tenantField,
} from "../../domain/shared/baseSchema";
import { CHANNELS, LANGUAGES } from "../constants";

export interface IAudienceProfile extends Document {
  audienceProfileId: string;
  tenantId: string;
  appKey: string;
  name: string;
  demographics?: Record<string, unknown>;
  locations?: unknown[];
  languages: (typeof LANGUAGES)[number][];
  interests: string[];
  pains: string[];
  desires: string[];
  objections: string[];
  buyingMotivations: string[];
  awarenessLevel?: string;
  preferredChannels: (typeof CHANNELS)[number][];
  behavioralSignals?: Record<string, unknown>;
  exclusions?: unknown[];
  active: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IAudienceProfile>(
  {
    audienceProfileId: publicIdField("audienceProfile"),
    tenantId: tenantField,
    appKey: appKeyField,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    demographics: { type: Schema.Types.Mixed, default: undefined },
    locations: { type: [Schema.Types.Mixed], default: undefined },
    languages: {
      type: [{ type: String, enum: LANGUAGES }],
      default: ["en"],
    },
    interests: {
      type: [{ type: String, trim: true, maxlength: 128 }],
      default: [],
    },
    pains: {
      type: [{ type: String, trim: true, maxlength: 512 }],
      default: [],
    },
    desires: {
      type: [{ type: String, trim: true, maxlength: 512 }],
      default: [],
    },
    objections: {
      type: [{ type: String, trim: true, maxlength: 512 }],
      default: [],
    },
    buyingMotivations: {
      type: [{ type: String, trim: true, maxlength: 512 }],
      default: [],
    },
    awarenessLevel: { type: String, trim: true, maxlength: 64, default: undefined },
    preferredChannels: {
      type: [{ type: String, enum: CHANNELS }],
      default: [],
    },
    behavioralSignals: { type: Schema.Types.Mixed, default: undefined },
    exclusions: { type: [Schema.Types.Mixed], default: undefined },
    active: { type: Boolean, default: true },
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("audience_profiles")
);

schema.index({ tenantId: 1, audienceProfileId: 1 }, { unique: true });
schema.index({ tenantId: 1, active: 1, name: 1 });
schema.index({ tenantId: 1, createdAt: -1 });

export const AudienceProfile =
  (mongoose.models.AudienceProfile as mongoose.Model<IAudienceProfile>) ??
  mongoose.model<IAudienceProfile>("AudienceProfile", schema);
