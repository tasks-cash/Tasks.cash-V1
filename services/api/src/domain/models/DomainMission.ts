import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  metadataField,
  rulesField,
  tagsField,
  tenantField,
} from "../shared/baseSchema";
import { MISSION_TYPES } from "../shared/lifecycle";

export const MISSION_STATUSES = ["draft", "active", "paused", "completed", "archived"] as const;
export const VALIDATION_METHODS = ["automatic", "manual", "hybrid", "external"] as const;

export interface IDomainMission extends Document {
  missionId: string;
  tenantId: string;
  appKey: string;
  campaignId?: string;
  challengeId?: string;
  name: string;
  description?: string;
  instructions?: string;
  missionType: (typeof MISSION_TYPES)[number];
  status: (typeof MISSION_STATUSES)[number];
  order: number;
  isRequired: boolean;
  startAt?: Date;
  endAt?: Date;
  completionLimit?: number;
  perUserCompletionLimit: number;
  validationMethod: (typeof VALIDATION_METHODS)[number];
  validationRules?: Record<string, unknown>;
  scoringRules?: Record<string, unknown>;
  rewardRules?: Record<string, unknown>;
  evidenceRequirements?: Record<string, unknown>;
  cooldown?: Record<string, unknown>;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDomainMission>(
  {
    missionId: publicIdField("mission"),
    tenantId: tenantField,
    appKey: appKeyField,
    campaignId: { type: String, trim: true, default: undefined },
    challengeId: { type: String, trim: true, default: undefined },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 10_000 },
    instructions: { type: String, trim: true, maxlength: 20_000 },
    missionType: { type: String, enum: MISSION_TYPES, required: true },
    status: { type: String, enum: MISSION_STATUSES, default: "draft", required: true },
    order: { type: Number, min: 0, default: 0 },
    isRequired: { type: Boolean, default: true },
    startAt: { type: Date, default: undefined },
    endAt: { type: Date, default: undefined },
    completionLimit: { type: Number, min: 1, default: undefined },
    perUserCompletionLimit: { type: Number, min: 1, default: 1 },
    validationMethod: { type: String, enum: VALIDATION_METHODS, default: "manual", required: true },
    validationRules: rulesField,
    scoringRules: rulesField,
    rewardRules: rulesField,
    evidenceRequirements: rulesField,
    cooldown: rulesField,
    tags: tagsField,
    metadata: metadataField,
    ...auditFields,
  },
  domainSchemaOptions("domain_missions")
);

schema.pre("validate", function (this: IDomainMission, next) {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    next(new Error("Mission endAt must be after startAt"));
    return;
  }
  next();
});

schema.index({ tenantId: 1, missionId: 1 }, { unique: true });
schema.index({ tenantId: 1, challengeId: 1, order: 1 });
schema.index({ tenantId: 1, campaignId: 1, status: 1 });
schema.index({ tenantId: 1, missionType: 1, status: 1 });
schema.index({ tenantId: 1, createdAt: -1 });

export const DomainMission =
  (mongoose.models.DomainMission as mongoose.Model<IDomainMission>) ??
  mongoose.model<IDomainMission>("DomainMission", schema);
