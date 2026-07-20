import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  metadataField,
  rulesField,
  tenantField,
} from "../shared/baseSchema";
import { CHALLENGE_TYPES, type DomainChallengeType } from "../shared/lifecycle";

export interface IChallengeTemplate extends Document {
  templateId: string;
  tenantId: string;
  appKey: string;
  name: string;
  description?: string;
  challengeType: DomainChallengeType;
  defaultInstructions?: string;
  defaultRules?: Record<string, unknown>;
  defaultValidationRules?: Record<string, unknown>;
  defaultScoringRules?: Record<string, unknown>;
  defaultRewardRules?: Record<string, unknown>;
  defaultDuration?: number;
  supportedLanguages: string[];
  isSystemTemplate: boolean;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IChallengeTemplate>(
  {
    templateId: publicIdField("challengeTemplate"),
    tenantId: tenantField,
    appKey: appKeyField,
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5_000 },
    challengeType: { type: String, enum: CHALLENGE_TYPES, required: true },
    defaultInstructions: { type: String, trim: true, maxlength: 20_000 },
    defaultRules: rulesField,
    defaultValidationRules: rulesField,
    defaultScoringRules: rulesField,
    defaultRewardRules: rulesField,
    /** Default duration in minutes. */
    defaultDuration: { type: Number, min: 1, default: undefined },
    supportedLanguages: {
      type: [{ type: String, lowercase: true, match: /^[a-z]{2}(-[a-z]{2})?$/ }],
      default: ["en"],
    },
    // System templates are locked: edits/deletes require elevated permission
    // (enforced in the repository/service layer — see docs/DOMAIN_MODELS.md).
    isSystemTemplate: { type: Boolean, default: false, immutable: true },
    isActive: { type: Boolean, default: true },
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("challenge_templates")
);

schema.index({ tenantId: 1, templateId: 1 }, { unique: true });
schema.index({ tenantId: 1, appKey: 1, challengeType: 1, isActive: 1 });
schema.index({ tenantId: 1, isSystemTemplate: 1 });

export const ChallengeTemplate =
  (mongoose.models.ChallengeTemplate as mongoose.Model<IChallengeTemplate>) ??
  mongoose.model<IChallengeTemplate>("ChallengeTemplate", schema);
