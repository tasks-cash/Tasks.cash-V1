import { createHash } from "crypto";
import { z } from "zod";

export const DISTRIBUTION_API_VERSION = "v1" as const;
export const PROOF_COMPLETED_EVENT_TYPE = "proof.verification.completed" as const;
export const PROOF_COMPLETED_EVENT_VERSION = 1 as const;
export const DISTRIBUTION_ENDPOINTS = Object.freeze({
  createAssignment: { method: "POST", path: "/api/integrations/tasks-cash/distribution/assignments" },
  getAssignment: { method: "GET", path: "/api/integrations/tasks-cash/distribution/assignments/:externalAssignmentId" },
  cancelAssignment: { method: "POST", path: "/api/integrations/tasks-cash/distribution/assignments/:externalAssignmentId/cancel" },
  createProofUploadSession: { method: "POST", path: "/api/integrations/tasks-cash/distribution/proofs/upload-session" },
  completeProof: { method: "POST", path: "/api/integrations/tasks-cash/distribution/proofs/:proofSubmissionId/complete" },
  getProofStatus: { method: "GET", path: "/api/integrations/tasks-cash/distribution/proofs/:proofSubmissionId/status" },
});
const externalId = z.string().trim().min(1).max(200);
const version = z.literal(DISTRIBUTION_API_VERSION);
const date = z.union([z.string().datetime(), z.date()]);
const safeUrl = z.string().url().max(2_048).refine((value: string) => ["http:", "https:"].includes(new URL(value).protocol), "unsafe URL");
export const rewardRecommendationSchema = z.enum(["eligible", "not_eligible", "pending_review", "expired", "duplicate", "fraud_suspected"]);
export const verificationDecisionSchema = z.enum(["verified", "rejected", "needs_review"]);
export const createAssignmentRequestSchema = z.object({
  apiVersion: version, templateId: externalId, copyVariantId: externalId, externalTaskId: externalId,
  externalUserId: externalId, externalAssignmentId: externalId, targetUrl: safeUrl,
  country: z.string().trim().min(2).max(3).optional(), correlationId: externalId.optional(),
  headerWidth: z.number().int().min(320).max(4_096).optional(), headerHeight: z.number().int().min(320).max(4_096).optional(),
}).strict();
export const proofUploadRequestSchema = z.object({
  apiVersion: version, externalAssignmentId: externalId, externalUserId: externalId,
  screenshotCount: z.number().int().min(1).max(5).optional(), contentLength: z.number().int().positive().max(20_971_520).optional(),
  postUrl: safeUrl.optional(), claimedPublicationAt: z.string().datetime().optional(), claimedGroupName: z.string().trim().min(1).max(500).optional(),
  userNote: z.string().max(2_000).optional(), correlationId: externalId.optional(),
}).strict();
export const completeProofRequestSchema = z.object({ apiVersion: version, externalUserId: externalId }).strict();
export const assignmentPackageSchema = z.object({
  apiVersion: version, externalAssignmentId: externalId, status: z.string().min(1), platform: z.string().min(1),
  targetAudience: z.string().min(1), communityRules: z.array(z.string()), approvedPostText: z.string(), headline: z.string(),
  cta: z.string(), hashtags: z.array(z.string()), requiredDisclosure: z.string(), uniqueTrackedLink: safeUrl,
  proofMarker: z.string().min(1), qrDownloadUrl: safeUrl, headerDownloadUrl: safeUrl, postingInstructions: z.string(),
  screenshotRequirements: z.record(z.string(), z.unknown()), postUrlRequirement: z.enum(["optional", "required", "forbidden"]),
  proofDeadline: date, assignmentExpiration: date, rewardEligibilityRecommendation: rewardRecommendationSchema,
}).strict();
export const cancelAssignmentResponseSchema = z.object({
  apiVersion: version, externalAssignmentId: externalId, status: z.literal("cancelled"), rewardEligibilityRecommendation: rewardRecommendationSchema,
}).strict();
export const proofUploadResponseSchema = z.object({
  apiVersion: version, proofSubmissionId: externalId,
  evidence: z.array(z.object({ evidenceId: externalId, kind: z.literal("screenshot"), contentType: z.literal("image/png"), uploadUrl: safeUrl, uploadExpiresAt: date }).strict()).max(5),
  expiresAt: date.optional(),
}).strict();
export const proofCompletionResponseSchema = z.object({
  apiVersion: version, proofSubmissionId: externalId, externalAssignmentId: externalId,
  status: z.enum(["submitted", "queued"]), submittedAt: date.optional(),
}).strict();
export const proofStatusResponseSchema = z.object({
  apiVersion: version, proofSubmissionId: externalId, externalAssignmentId: externalId,
  status: z.enum(["upload_pending", "submitted", "queued", "verifying", "needs_review", "verified", "rejected", "cancelled"]),
  submittedAt: date.optional(), createdAt: date.optional(), updatedAt: date.optional(),
}).strict();
export const proofCompletedEventSchema = z.object({
  eventId: externalId, eventVersion: z.literal(PROOF_COMPLETED_EVENT_VERSION), eventType: z.literal(PROOF_COMPLETED_EVENT_TYPE),
  occurredAt: z.string().datetime(), externalTaskId: externalId, externalUserId: externalId, externalAssignmentId: externalId,
  proofSubmissionId: externalId, verificationDecision: verificationDecisionSchema, verificationConfidence: z.number().min(0).max(1),
  rewardEligibilityRecommendation: rewardRecommendationSchema,
  reasonCodes: z.array(z.string().min(1).max(200)).max(100).refine((items) => new Set(items).size === items.length, "duplicate reason code"),
  resultChecksum: z.string().regex(/^[a-f0-9]{64}$/), correlationId: externalId,
}).strict();
export type CreateAssignmentRequest = z.infer<typeof createAssignmentRequestSchema>;
export type AssignmentPackage = z.infer<typeof assignmentPackageSchema>;
export type ProofUploadRequest = z.infer<typeof proofUploadRequestSchema>;
export type ProofCompletedEvent = z.infer<typeof proofCompletedEventSchema>;
function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, canonicalValue(item)]));
  return value;
}
export const canonicalJson = (value: unknown) => JSON.stringify(canonicalValue(value));
export function resultChecksum(input: { decision: string; scores: Record<string, number>; reasons: string[] }): string {
  return createHash("sha256").update(canonicalJson({ ...input, reasons: [...new Set(input.reasons)].sort() })).digest("hex");
}
export function eventResultChecksum(event: ProofCompletedEvent): string {
  return resultChecksum({ decision: event.verificationDecision, reasons: event.reasonCodes, scores: { overallVerificationScore: event.verificationConfidence } });
}
