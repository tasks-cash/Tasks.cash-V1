import { randomBytes } from "crypto";
import mongoose, { Schema } from "mongoose";

const publicId = (prefix: string) => `${prefix}_${randomBytes(16).toString("hex")}`;
const assignmentStatuses = ["requesting","active","awaiting_proof","proof_uploading","verifying","needs_review","verified_pending_reward_review","rejected","expired","cancelled","error"] as const;
const inboxStatuses = ["received","queued","processing","processed","retry_scheduled","dead_letter","ignored_duplicate","rejected_conflict"] as const;

const assignmentSchema = new Schema({
  publicId: { type: String, required: true, immutable: true, default: () => publicId("mda") },
  tenantId: { type: String, required: true, lowercase: true, trim: true }, taskId: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" }, submissionId: String,
  externalTaskId: { type: String, required: true }, externalUserId: { type: String, required: true },
  externalAssignmentId: { type: String, required: true }, externalTemplateId: String, contractVersion: { type: String, default: "v1" },
  assignmentStatus: { type: String, enum: assignmentStatuses, required: true, default: "requesting" },
  platform: String, country: String, locale: String, language: String, audience: String,
  communityRules: [String], approvedPostText: String, headline: String, callToAction: String, hashtags: [String],
  requiredDisclosure: String, proofMarker: String, trackedLink: String,
  qrAsset: { url: String, expiresAt: Date }, headerAsset: { url: String, expiresAt: Date },
  postingInstructions: String, screenshotRequirements: Schema.Types.Mixed, postUrlRequirement: String,
  proofDeadline: Date, assignmentExpiration: Date, proofSubmissionId: String, lastProofStatus: String,
  lastVerificationDecision: String, lastRewardRecommendation: String, lastReasonCodes: [String],
  packageChecksum: String, requestId: String, correlationId: String,
  idempotencyKeyHash: { type: String, required: true }, sourceCampaignRevision: { type: String, default: "v1" },
  cancelledAt: Date, expiredAt: Date,
}, { collection: "miraaj_distribution_assignments", timestamps: true, strict: true });
assignmentSchema.index({ tenantId: 1, externalAssignmentId: 1 }, { unique: true });
assignmentSchema.index({ tenantId: 1, taskId: 1, userId: 1, sourceCampaignRevision: 1 }, { unique: true });
assignmentSchema.index({ tenantId: 1, idempotencyKeyHash: 1 }, { unique: true });
assignmentSchema.index({ tenantId: 1, assignmentStatus: 1, updatedAt: -1 });
assignmentSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
assignmentSchema.index({ tenantId: 1, taskId: 1, assignmentStatus: 1 });
assignmentSchema.index({ assignmentStatus: 1, assignmentExpiration: 1 });

const inboxSchema = new Schema({
  publicId: { type: String, required: true, immutable: true, default: () => publicId("mie") },
  eventId: { type: String, required: true, immutable: true }, eventType: { type: String, required: true, immutable: true },
  eventVersion: { type: Number, required: true, immutable: true }, occurredAt: { type: Date, required: true }, receivedAt: { type: Date, required: true },
  rawBodySha256: { type: String, required: true, immutable: true }, payloadSha256: { type: String, required: true, immutable: true },
  resultChecksum: { type: String, required: true, immutable: true }, correlationId: String,
  externalTaskId: String, externalUserId: String, externalAssignmentId: String, proofSubmissionId: String,
  payload: { type: Schema.Types.Mixed, required: true, immutable: true, select: false },
  processingStatus: { type: String, enum: inboxStatuses, default: "received" }, attemptCount: { type: Number, default: 0 },
  nextAttemptAt: Date, claimedAt: Date, claimedBy: String, processedAt: Date, deadLetteredAt: Date,
  lastSafeErrorCode: String, lastSafeErrorMessage: String, retainUntil: { type: Date, required: true },
}, { collection: "miraaj_integration_inbox_events", timestamps: true, strict: true });
inboxSchema.index({ eventId: 1 }, { unique: true });
inboxSchema.index({ processingStatus: 1, nextAttemptAt: 1 });
inboxSchema.index({ externalAssignmentId: 1, occurredAt: 1 });
inboxSchema.index({ retainUntil: 1 }, { expireAfterSeconds: 0 });

const proofResultSchema = new Schema({
  publicId: { type: String, required: true, immutable: true, default: () => publicId("mpr") },
  tenantId: { type: String, required: true, lowercase: true }, assignmentId: { type: Schema.Types.ObjectId, required: true },
  submissionId: String, eventId: { type: String, required: true, immutable: true }, eventVersion: { type: Number, required: true, immutable: true },
  externalTaskId: String, externalUserId: String, externalAssignmentId: String, proofSubmissionId: String,
  verificationDecision: String, verificationConfidence: Number, rewardEligibilityRecommendation: String,
  reasonCodes: [String], resultChecksum: String, payloadDigest: String, correlationId: String,
  occurredAt: Date, receivedAt: Date, processedAt: Date, reviewRequired: { type: Boolean, default: true },
  reviewStatus: { type: String, default: "pending" }, immutableRevision: { type: Number, required: true },
}, { collection: "miraaj_proof_results", timestamps: true, strict: true });
proofResultSchema.index({ eventId: 1 }, { unique: true });
proofResultSchema.index({ proofSubmissionId: 1, immutableRevision: 1 }, { unique: true });
proofResultSchema.index({ assignmentId: 1, immutableRevision: 1 }, { unique: true });
proofResultSchema.index({ tenantId: 1, reviewStatus: 1, createdAt: 1 });

export const MiraajDistributionAssignment = mongoose.models.MiraajDistributionAssignment ?? mongoose.model("MiraajDistributionAssignment", assignmentSchema);
export const MiraajIntegrationInboxEvent = mongoose.models.MiraajIntegrationInboxEvent ?? mongoose.model("MiraajIntegrationInboxEvent", inboxSchema);
export const MiraajProofResult = mongoose.models.MiraajProofResult ?? mongoose.model("MiraajProofResult", proofResultSchema);
