import type { Types } from "mongoose";
import { miraajDistributionClient } from "./client";
import { getMiraajDistributionConfig } from "./config";
import { MiraajDistributionError } from "./errors";
import { distributionMetric } from "./metrics";
import { MiraajDistributionAssignment } from "./models";

async function owned(tenantId: string, userId: Types.ObjectId, publicId: string) {
  if (!getMiraajDistributionConfig().proofEnabled) throw new MiraajDistributionError("proof_disabled", "Distribution proof flow is disabled", false, 503);
  const doc = await MiraajDistributionAssignment.findOne({ tenantId, userId, publicId });
  if (!doc) throw new MiraajDistributionError("assignment_not_found", "Assignment not found", false, 404);
  if (["cancelled","expired","rejected"].includes(String(doc.assignmentStatus))) throw new MiraajDistributionError("assignment_inactive", "Assignment cannot accept proof", false, 409);
  if (doc.proofDeadline && new Date(doc.proofDeadline).getTime() < Date.now()) throw new MiraajDistributionError("proof_deadline_expired", "Proof deadline expired", false, 409);
  return doc;
}

export async function createProofUpload(input: {
  tenantId: string; userId: Types.ObjectId; publicId: string; externalUserId: string; screenshotCount?: number;
  contentLength?: number; postUrl?: string; claimedPublicationAt?: string; claimedGroupName?: string; userNote?: string;
}) {
  const doc = await owned(input.tenantId, input.userId, input.publicId);
  const response = await miraajDistributionClient.createProofUploadSession({
    apiVersion: "v1", externalAssignmentId: String(doc.externalAssignmentId), externalUserId: input.externalUserId,
    screenshotCount: input.screenshotCount, contentLength: input.contentLength, postUrl: input.postUrl,
    claimedPublicationAt: input.claimedPublicationAt, claimedGroupName: input.claimedGroupName, userNote: input.userNote,
    correlationId: String(doc.correlationId),
  }, { externalUserId: input.externalUserId, idempotencyKey: `proof-upload:${doc.publicId}`, correlationId: String(doc.correlationId) });
  doc.proofSubmissionId = response.proofSubmissionId; doc.assignmentStatus = "proof_uploading"; doc.lastProofStatus = "upload_pending"; await doc.save();
  distributionMetric("proof_upload_sessions");
  return {
    proofSubmissionId: response.proofSubmissionId,
    evidence: response.evidence.map((item) => ({ evidenceId: item.evidenceId, kind: item.kind, contentType: item.contentType, uploadUrl: item.uploadUrl, uploadExpiresAt: item.uploadExpiresAt })),
    expiresAt: response.expiresAt,
  };
}

export async function completeProof(input: { tenantId: string; userId: Types.ObjectId; publicId: string; externalUserId: string }) {
  const doc = await owned(input.tenantId, input.userId, input.publicId);
  if (!doc.proofSubmissionId) throw new MiraajDistributionError("proof_missing", "Proof upload session not created", false, 409);
  const response = await miraajDistributionClient.completeProofSubmission(String(doc.proofSubmissionId), {
    externalUserId: input.externalUserId, idempotencyKey: `proof-complete:${doc.proofSubmissionId}`, correlationId: String(doc.correlationId),
  });
  doc.assignmentStatus = "verifying"; doc.lastProofStatus = response.status; await doc.save(); distributionMetric("proof_completion_requests");
  return { proofSubmissionId: response.proofSubmissionId, status: response.status, submittedAt: response.submittedAt };
}

export async function proofStatus(input: { tenantId: string; userId: Types.ObjectId; publicId: string; externalUserId: string }) {
  const doc = await owned(input.tenantId, input.userId, input.publicId);
  if (!doc.proofSubmissionId) return { status: "not_started" };
  const response = await miraajDistributionClient.getProofStatus(String(doc.proofSubmissionId), {
    externalUserId: input.externalUserId, idempotencyKey: `proof-status:${doc.proofSubmissionId}`, correlationId: String(doc.correlationId),
  });
  doc.lastProofStatus = response.status; await doc.save();
  return { proofSubmissionId: response.proofSubmissionId, status: response.status, submittedAt: response.submittedAt, updatedAt: response.updatedAt };
}
