import { getMiraajDistributionConfig } from "./config";
import { miraajDistributionClient } from "./client";
import { processInboxEvent } from "./inboxService";
import { distributionMetric } from "./metrics";
import { MiraajDistributionAssignment, MiraajIntegrationInboxEvent } from "./models";

export async function reconcileAssignments(limit = 100) {
  const config = getMiraajDistributionConfig();
  if (!config.reconciliationEnabled) return { disabled: true, checked: 0 };
  const docs = await MiraajDistributionAssignment.find({ assignmentStatus: { $in: ["requesting","active","awaiting_proof","verifying","error"] } }).limit(limit);
  let mismatches = 0;
  for (const doc of docs) {
    const remote = await miraajDistributionClient.getAssignment(String(doc.externalAssignmentId), {
      externalUserId: String(doc.externalUserId), idempotencyKey: `assignment-reconcile:${doc.publicId}`, correlationId: String(doc.correlationId),
    });
    if (remote.status !== doc.assignmentStatus) { mismatches += 1; distributionMetric("reconciliation_mismatches"); }
  }
  return { disabled: false, checked: docs.length, mismatches };
}
export async function reconcileProofs(limit = 100) {
  const config = getMiraajDistributionConfig();
  if (!config.reconciliationEnabled) return { disabled: true, checked: 0 };
  const docs = await MiraajDistributionAssignment.find({ proofSubmissionId: { $exists: true }, assignmentStatus: { $in: ["proof_uploading","verifying"] } }).limit(limit);
  let mismatches = 0;
  for (const doc of docs) {
    const remote = await miraajDistributionClient.getProofStatus(String(doc.proofSubmissionId), {
      externalUserId: String(doc.externalUserId), idempotencyKey: `proof-reconcile:${doc.proofSubmissionId}`, correlationId: String(doc.correlationId),
    });
    if (remote.status !== doc.lastProofStatus) { doc.lastProofStatus = remote.status; await doc.save(); mismatches += 1; }
  }
  return { disabled: false, checked: docs.length, mismatches };
}
export async function recoverInbox(limit = 100) {
  const docs = await MiraajIntegrationInboxEvent.find({ processingStatus: { $in: ["received","queued","retry_scheduled"] }, $or: [{ nextAttemptAt: { $lte: new Date() } }, { nextAttemptAt: { $exists: false } }] }).limit(limit).lean();
  const results = await Promise.allSettled(docs.map((doc) => processInboxEvent(doc.eventId, "inbox-recovery")));
  return { checked: docs.length, processed: results.filter((item) => item.status === "fulfilled").length };
}
