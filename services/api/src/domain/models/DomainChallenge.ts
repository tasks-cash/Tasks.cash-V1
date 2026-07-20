import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  auditFields,
  domainSchemaOptions,
  metadataField,
  rulesField,
  slugField,
  tagsField,
  tenantField,
  timezoneField,
} from "../shared/baseSchema";
import {
  CHALLENGE_STATUSES,
  CHALLENGE_TYPES,
  VISIBILITIES,
  type ChallengeStatus,
  type DomainChallengeType,
} from "../shared/lifecycle";

export const CHALLENGE_DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;

export interface IDomainChallenge extends Document {
  challengeId: string;
  tenantId: string;
  appKey: string;
  campaignId?: string;
  templateId?: string;
  name: string;
  slug: string;
  description?: string;
  instructions?: string;
  challengeType: DomainChallengeType;
  status: ChallengeStatus;
  difficulty: (typeof CHALLENGE_DIFFICULTIES)[number];
  visibility: (typeof VISIBILITIES)[number];
  startAt?: Date;
  endAt?: Date;
  timezone: string;
  recurrence?: Record<string, unknown>;
  cooldown?: Record<string, unknown>;
  participationRules?: Record<string, unknown>;
  eligibilityRules?: Record<string, unknown>;
  validationRules?: Record<string, unknown>;
  scoringRules?: Record<string, unknown>;
  rewardRules?: Record<string, unknown>;
  participantLimit?: number;
  participationCount: number;
  completionCount: number;
  missionIds: string[];
  tags: string[];
  media?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  publishedAt?: Date;
  archivedAt?: Date;
  archivedBy?: string;
  deletedAt?: Date;
  deletedBy?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IDomainChallenge>(
  {
    challengeId: publicIdField("challenge"),
    tenantId: tenantField,
    appKey: appKeyField,
    campaignId: { type: String, trim: true, default: undefined },
    templateId: { type: String, trim: true, default: undefined },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: slugField,
    description: { type: String, trim: true, maxlength: 10_000 },
    instructions: { type: String, trim: true, maxlength: 20_000 },
    challengeType: { type: String, enum: CHALLENGE_TYPES, required: true },
    status: { type: String, enum: CHALLENGE_STATUSES, default: "draft", required: true },
    difficulty: { type: String, enum: CHALLENGE_DIFFICULTIES, default: "easy", required: true },
    visibility: { type: String, enum: VISIBILITIES, default: "private", required: true },
    startAt: { type: Date, default: undefined },
    endAt: { type: Date, default: undefined },
    timezone: timezoneField,
    recurrence: rulesField,
    cooldown: rulesField,
    participationRules: rulesField,
    eligibilityRules: rulesField,
    validationRules: rulesField,
    scoringRules: rulesField,
    rewardRules: rulesField,
    participantLimit: { type: Number, min: 1, default: undefined },
    participationCount: { type: Number, min: 0, default: 0 },
    completionCount: { type: Number, min: 0, default: 0 },
    missionIds: { type: [String], default: [] },
    tags: tagsField,
    media: metadataField,
    metadata: metadataField,
    approvedBy: { type: String, trim: true, maxlength: 128, default: undefined },
    publishedAt: { type: Date, default: undefined },
    ...auditFields,
  },
  domainSchemaOptions("domain_challenges")
);

schema.pre("validate", function (this: IDomainChallenge, next) {
  if (this.startAt && this.endAt && this.endAt <= this.startAt) {
    next(new Error("Challenge endAt must be after startAt"));
    return;
  }
  next();
});

schema.index({ tenantId: 1, challengeId: 1 }, { unique: true });
schema.index(
  { tenantId: 1, appKey: 1, slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null }, name: "uniq_challenge_slug_active" }
);
schema.index({ tenantId: 1, campaignId: 1, status: 1 });
schema.index({ tenantId: 1, status: 1, startAt: 1 });
schema.index({ tenantId: 1, challengeType: 1, status: 1 });
schema.index({ tenantId: 1, createdAt: -1 });
schema.index({ tenantId: 1, tags: 1 });

export const DomainChallenge =
  (mongoose.models.DomainChallenge as mongoose.Model<IDomainChallenge>) ??
  mongoose.model<IDomainChallenge>("DomainChallenge", schema);
