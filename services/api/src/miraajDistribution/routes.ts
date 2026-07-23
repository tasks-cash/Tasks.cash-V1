import { randomUUID } from "crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import mongoose from "mongoose";
import { isRedisReady } from "../config/redis";
import { authMiddleware, adminMiddleware, requireAdminPermission, requireAuthorizedTenant, type AuthRequest } from "../middleware/auth";
import { enqueueNamedJob } from "../jobs/enqueue";
import { JOB_NAMES } from "../jobs/contracts/jobTypes";
import { createAssignment, cancelOwnAssignment, getOwnAssignment } from "./assignmentService";
import { acceptCallback } from "./callbackService";
import { distributionReadiness, getMiraajDistributionConfig } from "./config";
import { MiraajDistributionError } from "./errors";
import { distributionMetrics } from "./metrics";
import { MiraajDistributionAssignment, MiraajIntegrationInboxEvent, MiraajProofResult } from "./models";
import { completeProof, createProofUpload, proofStatus } from "./proofService";
import { reconcileAssignments, reconcileProofs, recoverInbox } from "./reconciliationService";

const userRoutes = Router(); const callbackRoutes = Router(); const adminRoutes = Router();
const callbackWindows = new Map<string, { startedAt: number; count: number }>();
const asyncRoute = (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
  (req: AuthRequest, res: Response, next: NextFunction) => void fn(req, res).catch(next);
const tenant = (req: AuthRequest) => req.header("x-tenant-id")?.trim() || "public";
const param = (value: string | string[]) => Array.isArray(value) ? value[0] : value;
const userIdentity = (req: AuthRequest) => {
  if (!req.user) throw new MiraajDistributionError("unauthorized", "Unauthorized", false, 401);
  return { userId: req.user._id as mongoose.Types.ObjectId, externalUserId: `tasks-cash:${req.user._id}` };
};

userRoutes.use(authMiddleware);
userRoutes.post("/assignments", asyncRoute(async (req, res) => {
  const identity = userIdentity(req); const body = req.body as Record<string, unknown>;
  const idempotencyKey = req.header("idempotency-key")?.trim();
  if (!idempotencyKey) throw new MiraajDistributionError("idempotency_required", "idempotency-key required", false, 400);
  const result = await createAssignment({ tenantId: tenant(req), taskId: String(body.taskId ?? ""), ...identity, idempotencyKey, correlationId: req.header("x-correlation-id") || randomUUID() });
  res.status(202).json({ success: true, data: result });
}));
userRoutes.get("/assignments/:assignmentId", asyncRoute(async (req, res) => {
  const identity = userIdentity(req); res.json({ success: true, data: await getOwnAssignment(tenant(req), identity.userId, param(req.params.assignmentId)) });
}));
userRoutes.post("/assignments/:assignmentId/cancel", asyncRoute(async (req, res) => {
  const identity = userIdentity(req); res.json({ success: true, data: await cancelOwnAssignment(tenant(req), identity.userId, param(req.params.assignmentId), identity.externalUserId) });
}));
userRoutes.post("/assignments/:assignmentId/proof/upload-session", asyncRoute(async (req, res) => {
  const identity = userIdentity(req); const body = req.body as Record<string, unknown>;
  const data = await createProofUpload({ tenantId: tenant(req), publicId: param(req.params.assignmentId), ...identity,
    screenshotCount: body.screenshotCount as number | undefined, contentLength: body.contentLength as number | undefined,
    postUrl: body.postUrl as string | undefined, claimedPublicationAt: body.claimedPublicationAt as string | undefined,
    claimedGroupName: body.claimedGroupName as string | undefined, userNote: body.userNote as string | undefined });
  res.status(201).json({ success: true, data });
}));
userRoutes.post("/assignments/:assignmentId/proof/complete", asyncRoute(async (req, res) => {
  const identity = userIdentity(req); res.status(202).json({ success: true, data: await completeProof({ tenantId: tenant(req), publicId: param(req.params.assignmentId), ...identity }) });
}));
userRoutes.get("/assignments/:assignmentId/proof/status", asyncRoute(async (req, res) => {
  const identity = userIdentity(req); res.json({ success: true, data: await proofStatus({ tenantId: tenant(req), publicId: param(req.params.assignmentId), ...identity }) });
}));

callbackRoutes.post("/events", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = req.ip || "unknown"; const now = Date.now(); const current = callbackWindows.get(key);
    const window = !current || now - current.startedAt >= 60_000 ? { startedAt: now, count: 0 } : current;
    window.count += 1; callbackWindows.set(key, window);
    if (window.count > 300) throw new MiraajDistributionError("rate_limited", "Callback rate limit exceeded", false, 429);
    const result = await acceptCallback(req);
    const config = getMiraajDistributionConfig();
    if (config.callbackProcessingEnabled && result.body.eventId) {
      try {
        await enqueueNamedJob(JOB_NAMES.MIRAAJ_DISTRIBUTION_INBOX_PROCESS, {
          tenantId: "public", appKey: "admin", idempotencyKey: `miraaj-distribution-inbox:${result.body.eventId}`,
          correlationId: result.body.eventId, payload: { eventId: result.body.eventId },
        }, { jobId: `miraaj-distribution-inbox-${result.body.eventId}` });
      } catch {
        // The durable inbox remains recoverable when the queue is unavailable.
      }
    }
    res.status(result.status).json(result.body);
  } catch (error) { next(error); }
});

adminRoutes.use(authMiddleware, adminMiddleware, requireAuthorizedTenant);
adminRoutes.get("/health", requireAdminPermission("miraajDistribution.settings.read"), asyncRoute(async (req, res) => {
  const [backlog, deadLetters] = await Promise.all([
    MiraajIntegrationInboxEvent.countDocuments({ processingStatus: { $in: ["received","queued","retry_scheduled"] } }),
    MiraajIntegrationInboxEvent.countDocuments({ processingStatus: "dead_letter" }),
  ]);
  res.json({ success: true, data: { ...distributionReadiness(), redisAvailable: isRedisReady(), mongoTransactionCapable: true, queueAvailable: isRedisReady(), inboxBacklog: backlog, deadLetterCount: deadLetters, metrics: distributionMetrics() } });
}));
adminRoutes.get("/assignments", requireAdminPermission("miraajDistribution.assignments.read"), asyncRoute(async (req, res) => {
  res.json({ success: true, data: await MiraajDistributionAssignment.find({ tenantId: req.authorizedTenantId }).select("-idempotencyKeyHash -qrAsset.url -headerAsset.url").sort({ createdAt: -1 }).limit(100).lean() });
}));
adminRoutes.get("/proof-results", requireAdminPermission("miraajDistribution.proofs.read"), asyncRoute(async (req, res) => {
  res.json({ success: true, data: await MiraajProofResult.find({ tenantId: req.authorizedTenantId }).sort({ createdAt: -1 }).limit(100).lean() });
}));
adminRoutes.get("/inbox", requireAdminPermission("miraajDistribution.inbox.read"), asyncRoute(async (_req, res) => {
  res.json({ success: true, data: await MiraajIntegrationInboxEvent.find({}).select("-payload -rawBodySha256 -payloadSha256").sort({ receivedAt: -1 }).limit(100).lean() });
}));
adminRoutes.post("/inbox/:eventId/retry", requireAdminPermission("miraajDistribution.inbox.retry"), asyncRoute(async (req, res) => {
  const eventId = param(req.params.eventId);
  await MiraajIntegrationInboxEvent.updateOne({ eventId, processingStatus: "dead_letter" }, { $set: { processingStatus: "retry_scheduled", nextAttemptAt: new Date() }, $unset: { deadLetteredAt: 1 } });
  res.status(202).json({ success: true, data: { eventId, status: "retry_scheduled" } });
}));
adminRoutes.post("/reconcile", requireAdminPermission("miraajDistribution.reconciliation.run"), asyncRoute(async (_req, res) => {
  const [assignments, proofs, inbox] = await Promise.all([reconcileAssignments(), reconcileProofs(), recoverInbox()]);
  res.status(202).json({ success: true, data: { assignments, proofs, inbox, rewardIssued: false } });
}));

export function distributionErrorHandler(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (error && typeof error === "object" && "type" in error && error.type === "entity.too.large") {
    res.status(413).json({ success: false, error: "Callback exceeds size limit", code: "payload_too_large" });
    return;
  }
  if (!(error instanceof MiraajDistributionError)) { next(error); return; }
  res.status(error.status).json({ success: false, error: error.message, code: error.code });
}
export { userRoutes as miraajDistributionUserRoutes, callbackRoutes as miraajDistributionCallbackRoutes, adminRoutes as miraajDistributionAdminRoutes };
