import mongoose, { Document, Schema } from "mongoose";
import { publicIdField } from "../shared/publicId";
import {
  appKeyField,
  domainSchemaOptions,
  idempotencyKeyField,
  metadataField,
  rulesField,
  tenantField,
  urlField,
} from "../shared/baseSchema";
import { MISSION_TYPES, SUBMISSION_STATUSES, type SubmissionStatus } from "../shared/lifecycle";

export const REWARD_ISSUE_STATUSES = ["none", "pending", "issued", "failed", "reversed"] as const;

export interface ISubmission extends Document {
  submissionId: string;
  tenantId: string;
  appKey: string;
  campaignId?: string;
  challengeId?: string;
  missionId: string;
  userId: mongoose.Types.ObjectId;
  submissionType: (typeof MISSION_TYPES)[number];
  status: SubmissionStatus;
  content?: Record<string, unknown>;
  text?: string;
  url?: string;
  media?: Array<Record<string, unknown>>;
  evidence?: Array<Record<string, unknown>>;
  submittedAt?: Date;
  validation?: Record<string, unknown>;
  automatedReview?: Record<string, unknown>;
  manualReview?: Record<string, unknown>;
  score?: number;
  rewardStatus: (typeof REWARD_ISSUE_STATUSES)[number];
  rewardId?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/** File references only — never binary media. */
const mediaRefSchema = new Schema(
  {
    kind: { type: String, enum: ["image", "video", "audio", "file"], required: true },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    storageKey: { type: String, trim: true, maxlength: 512 },
    mimeType: { type: String, trim: true, maxlength: 128 },
    sizeBytes: { type: Number, min: 0 },
    durationSeconds: { type: Number, min: 0 },
  },
  { _id: false, strict: true }
);

const schema = new Schema<ISubmission>(
  {
    submissionId: publicIdField("submission"),
    tenantId: tenantField,
    appKey: appKeyField,
    campaignId: { type: String, trim: true, default: undefined },
    challengeId: { type: String, trim: true, default: undefined },
    missionId: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submissionType: { type: String, enum: MISSION_TYPES, required: true },
    status: { type: String, enum: SUBMISSION_STATUSES, default: "draft", required: true },
    content: rulesField,
    text: { type: String, trim: true, maxlength: 20_000, default: undefined },
    url: urlField,
    media: { type: [mediaRefSchema], default: undefined },
    evidence: { type: [mediaRefSchema], default: undefined },
    submittedAt: { type: Date, default: undefined },
    // Server-side validation outcome — never trust client-calculated values.
    validation: rulesField,
    automatedReview: rulesField,
    manualReview: rulesField,
    score: { type: Number, min: 0, default: undefined },
    rewardStatus: { type: String, enum: REWARD_ISSUE_STATUSES, default: "none", required: true },
    rewardId: { type: String, trim: true, default: undefined },
    reviewedBy: { type: String, trim: true, maxlength: 128, default: undefined },
    reviewedAt: { type: Date, default: undefined },
    rejectionReason: { type: String, trim: true, maxlength: 2_000, default: undefined },
    idempotencyKey: idempotencyKeyField,
    metadata: metadataField,
  },
  domainSchemaOptions("domain_submissions")
);

schema.index({ tenantId: 1, submissionId: 1 }, { unique: true });
// One active submission per user+mission when the mission allows only one.
// Terminal rejected/cancelled/expired attempts don't block a retry.
schema.index(
  { tenantId: 1, missionId: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["draft", "submitted", "queued", "processing", "needs_review", "approved"] },
    },
    name: "uniq_active_submission_per_mission_user",
  }
);
// Client retry idempotency
schema.index(
  { tenantId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $exists: true } } }
);
// Review queue: oldest pending first
schema.index({ tenantId: 1, status: 1, submittedAt: 1 });
// User submission history
schema.index({ tenantId: 1, userId: 1, createdAt: -1 });
// Per-challenge moderation views
schema.index({ tenantId: 1, challengeId: 1, status: 1 });

export const Submission =
  (mongoose.models.Submission as mongoose.Model<ISubmission>) ??
  mongoose.model<ISubmission>("Submission", schema);
