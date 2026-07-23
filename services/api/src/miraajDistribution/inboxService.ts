import mongoose from "mongoose";
import { getRedis } from "../config/redis";
import { Submission } from "../domain/models/Submission";
import { AuditLog } from "../models/AuditLog";
import { getMiraajDistributionConfig } from "./config";
import type { ProofCompletedEvent } from "./contracts";
import { MiraajDistributionError } from "./errors";
import { distributionMetric } from "./metrics";
import { MiraajDistributionAssignment, MiraajIntegrationInboxEvent, MiraajProofResult } from "./models";

function outcome(event: ProofCompletedEvent): { assignmentStatus: string; submissionStatus: string; reviewRequired: boolean } {
  if (event.verificationDecision === "verified" && event.rewardEligibilityRecommendation === "eligible") {
    return { assignmentStatus: "verified_pending_reward_review", submissionStatus: "needs_review", reviewRequired: true };
  }
  if (event.verificationDecision === "needs_review" || ["pending_review","fraud_suspected"].includes(event.rewardEligibilityRecommendation)) {
    return { assignmentStatus: "needs_review", submissionStatus: "needs_review", reviewRequired: true };
  }
  if (event.rewardEligibilityRecommendation === "expired") return { assignmentStatus: "expired", submissionStatus: "expired", reviewRequired: false };
  if (event.verificationDecision === "rejected" || ["not_eligible","duplicate"].includes(event.rewardEligibilityRecommendation)) {
    return { assignmentStatus: "rejected", submissionStatus: "rejected", reviewRequired: event.rewardEligibilityRecommendation === "duplicate" };
  }
  throw new MiraajDistributionError("unknown_result_combination", "Verification result requires manual investigation", false, 409);
}

export async function reserveReplay(eventId: string, payloadDigest: string): Promise<"new" | "duplicate" | "conflict"> {
  const existing = await MiraajIntegrationInboxEvent.findOne({ eventId }).select("payloadSha256").lean() as { payloadSha256?: string } | null;
  if (existing) return existing.payloadSha256 === payloadDigest ? "duplicate" : "conflict";
  const redis = getRedis();
  if (redis?.status === "ready") {
    try {
      await redis.set(`miraaj:distribution:callback:${eventId}`, payloadDigest, "EX", 86_400, "NX");
    } catch {
      // MongoDB remains the durable replay authority.
    }
  }
  return "new";
}

export async function insertInbox(event: ProofCompletedEvent, rawDigest: string, payloadDigest: string) {
  const config = getMiraajDistributionConfig();
  try {
    const doc = await MiraajIntegrationInboxEvent.create({
      eventId: event.eventId, eventType: event.eventType, eventVersion: event.eventVersion,
      occurredAt: new Date(event.occurredAt), receivedAt: new Date(), rawBodySha256: rawDigest, payloadSha256: payloadDigest,
      resultChecksum: event.resultChecksum, correlationId: event.correlationId, externalTaskId: event.externalTaskId,
      externalUserId: event.externalUserId, externalAssignmentId: event.externalAssignmentId,
      proofSubmissionId: event.proofSubmissionId, payload: event, processingStatus: "received",
      retainUntil: new Date(Date.now() + config.inboxRetentionDays * 86_400_000),
    });
    return { doc, created: true };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      const existing = await MiraajIntegrationInboxEvent.findOne({ eventId: event.eventId }).select("payloadSha256");
      if (existing?.payloadSha256 === payloadDigest) return { doc: existing, created: false };
      throw new MiraajDistributionError("event_conflict", "Event ID payload conflict", false, 409);
    }
    throw error;
  }
}

export async function processInboxEvent(eventId: string, workerId = "distribution-worker") {
  const claimed = await MiraajIntegrationInboxEvent.findOneAndUpdate(
    { eventId, processingStatus: { $in: ["received","queued","retry_scheduled"] } },
    { $set: { processingStatus: "processing", claimedAt: new Date(), claimedBy: workerId }, $inc: { attemptCount: 1 } },
    { new: true },
  ).select("+payload");
  if (!claimed) return { eventId, skipped: true };
  const event = claimed.payload as ProofCompletedEvent;
  try {
    const assignment = await MiraajDistributionAssignment.findOne({ externalAssignmentId: event.externalAssignmentId });
    if (!assignment) throw new MiraajDistributionError("assignment_not_found", "Callback assignment not found", true, 404);
    if (String(assignment.externalTaskId) !== event.externalTaskId || String(assignment.externalUserId) !== event.externalUserId) {
      throw new MiraajDistributionError("ownership_mismatch", "Callback identity mismatch", false, 409);
    }
    if (String(assignment.proofSubmissionId ?? "") !== event.proofSubmissionId) {
      throw new MiraajDistributionError("proof_mismatch", "Callback proof mismatch", false, 409);
    }
    if (["cancelled","expired"].includes(String(assignment.assignmentStatus))) {
      throw new MiraajDistributionError("assignment_inactive", "Callback targets inactive assignment", false, 409);
    }
    const latest = await MiraajProofResult.findOne({ assignmentId: assignment._id }).sort({ immutableRevision: -1 }).lean() as { occurredAt?: Date; immutableRevision?: number } | null;
    if (latest?.occurredAt && new Date(latest.occurredAt).getTime() >= new Date(event.occurredAt).getTime()) {
      claimed.processingStatus = "processed"; claimed.processedAt = new Date(); claimed.lastSafeErrorCode = "stale_event"; await claimed.save();
      return { eventId, stale: true };
    }
    const mapped = outcome(event);
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const revision = Number(latest?.immutableRevision ?? 0) + 1;
        await MiraajProofResult.create([{
          tenantId: assignment.tenantId, assignmentId: assignment._id, submissionId: assignment.submissionId,
          eventId: event.eventId, eventVersion: event.eventVersion, externalTaskId: event.externalTaskId,
          externalUserId: event.externalUserId, externalAssignmentId: event.externalAssignmentId,
          proofSubmissionId: event.proofSubmissionId, verificationDecision: event.verificationDecision,
          verificationConfidence: event.verificationConfidence, rewardEligibilityRecommendation: event.rewardEligibilityRecommendation,
          reasonCodes: event.reasonCodes, resultChecksum: event.resultChecksum, payloadDigest: claimed.payloadSha256,
          correlationId: event.correlationId, occurredAt: new Date(event.occurredAt), receivedAt: claimed.receivedAt,
          processedAt: new Date(), reviewRequired: mapped.reviewRequired, reviewStatus: mapped.reviewRequired ? "pending" : "not_required",
          immutableRevision: revision,
        }], { session });
        await MiraajDistributionAssignment.updateOne({ _id: assignment._id }, { $set: {
          assignmentStatus: mapped.assignmentStatus, lastProofStatus: event.verificationDecision,
          lastVerificationDecision: event.verificationDecision, lastRewardRecommendation: event.rewardEligibilityRecommendation,
          lastReasonCodes: event.reasonCodes,
        } }, { session });
        if (assignment.submissionId) await Submission.updateOne(
          { tenantId: assignment.tenantId, submissionId: assignment.submissionId },
          { $set: { status: mapped.submissionStatus, automatedReview: {
            provider: "miraaj", decision: event.verificationDecision, confidence: event.verificationConfidence,
            recommendation: event.rewardEligibilityRecommendation, reasonCodes: event.reasonCodes, rewardIssued: false,
          } } }, { session },
        );
        await MiraajIntegrationInboxEvent.updateOne({ _id: claimed._id }, { $set: {
          processingStatus: "processed", processedAt: new Date(), claimedBy: workerId,
        } }, { session });
      });
    } finally { await session.endSession(); }
    await AuditLog.create({ actorId: assignment.userId, action: "miraaj_distribution.proof_result.processed", resource: assignment.publicId, metadata: { tenantId: assignment.tenantId, eventId, reviewRequired: mapped.reviewRequired, rewardIssued: false } });
    distributionMetric("inbox_processed");
    distributionMetric(mapped.assignmentStatus);
    return { eventId, status: mapped.assignmentStatus, rewardIssued: false };
  } catch (error) {
    const safe = error instanceof MiraajDistributionError ? error : new MiraajDistributionError("processing_failed", "Inbox processing failed", true);
    const config = getMiraajDistributionConfig();
    const dead = !safe.retryable || claimed.attemptCount >= config.maxRetries;
    claimed.processingStatus = dead ? "dead_letter" : "retry_scheduled";
    claimed.deadLetteredAt = dead ? new Date() : undefined;
    claimed.nextAttemptAt = dead ? undefined : new Date(Date.now() + config.retryBaseMs * 2 ** Math.max(0, claimed.attemptCount - 1));
    claimed.lastSafeErrorCode = safe.code; claimed.lastSafeErrorMessage = safe.message.slice(0, 200); await claimed.save();
    distributionMetric(dead ? "inbox_dead_letters" : "inbox_retries");
    throw safe;
  }
}
