/**
 * Admin APIs for BullMQ jobs platform — queues, executions, dead letters, cancel, enqueue.
 */
import { Router, Response } from "express";
import { z } from "zod";
import {
  authMiddleware,
  adminMiddleware,
  requireAdminPermission,
  AuthRequest,
} from "../middleware/auth";
import { writeDomainAudit } from "../domain/services/domainAudit";
import { actorContext, sendDomainError } from "../domain/http/adminHelpers";
import { DEFAULT_TENANT } from "../domain/shared/baseSchema";
import {
  JobExecution,
  JobDeadLetter,
  JobSchedule,
} from "../jobs/persistence/jobModels";
import { enqueueNamedJob } from "../jobs/enqueue";
import { cancelJob } from "../jobs/processing/jobCancellation";
import { getQueueCounts, listQueues } from "../jobs/queues/queueManager";
import { JOB_NAME_SET, JOB_NAMES } from "../jobs/contracts/jobTypes";
import { QUEUE_NAME_SET, type QueueName } from "../jobs/queues/queueNames";
import { getJobsDiagnostics } from "../jobs/bootstrap";
import { listJobHandlers } from "../jobs/registry/jobRegistry";
import { getJobsConfig } from "../jobs/config/jobConfig";
import { sanitizeJobPayload } from "../jobs/contracts/jobEnvelope";

const router = Router();
router.use(authMiddleware, adminMiddleware);

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().max(64).optional(),
  jobName: z.string().max(128).optional(),
  queueName: z.string().max(64).optional(),
});

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function tenantId(req: AuthRequest): string {
  return (req.headers["x-tenant-id"] as string)?.toLowerCase() || DEFAULT_TENANT;
}

function canReadAll(req: AuthRequest): boolean {
  const perms = (req.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  return perms.includes("system.full_access") || perms.includes("system.job.read_all");
}

function redactJobDoc(doc: Record<string, unknown>) {
  const copy = { ...doc };
  if (copy.envelope && typeof copy.envelope === "object") {
    const env = { ...(copy.envelope as Record<string, unknown>) };
    if (env.payload) env.payload = sanitizeJobPayload(env.payload);
    if (env.metadata) env.metadata = sanitizeJobPayload(env.metadata);
    copy.envelope = env;
  }
  if (copy.result) copy.result = sanitizeJobPayload(copy.result);
  return copy;
}

router.get("/jobs/overview", requireAdminPermission("job.read"), async (req: AuthRequest, res: Response) => {
  try {
    const diag = getJobsDiagnostics();
    const cfg = getJobsConfig();
    const counts: Record<string, Record<string, number>> = {};
    if (cfg.enabled) {
      for (const q of listQueues()) {
        counts[q] = await getQueueCounts(q);
      }
    }
    await writeDomainAudit({
      ...actorContext(req),
      action: "job.overview_read",
      entity: "jobs",
      entityId: "overview",
      metadata: { result: "ok" },
    });
    res.json({
      success: true,
      data: {
        ...diag,
        queueCounts: counts,
        handlers: listJobHandlers().map((h) => ({
          jobName: h.jobName,
          version: h.version,
          description: h.description,
        })),
      },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/jobs/queues", requireAdminPermission("job.read"), async (_req: AuthRequest, res: Response) => {
  try {
    const data = [];
    for (const q of listQueues()) {
      data.push({ name: q, counts: await getQueueCounts(q) });
    }
    res.json({ success: true, data });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/jobs/executions", requireAdminPermission("job.read"), async (req: AuthRequest, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (!canReadAll(req)) filter.tenantId = tenantId(req);
    else if (typeof req.query.tenantId === "string") filter.tenantId = req.query.tenantId.toLowerCase();
    if (q.status) filter.status = q.status;
    if (q.jobName) filter.jobName = q.jobName;
    if (q.queueName) filter.queueName = q.queueName;

    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      JobExecution.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
      JobExecution.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items.map((i) => redactJobDoc(i as Record<string, unknown>)),
      meta: { page: q.page, limit: q.limit, total },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get(
  "/jobs/executions/:jobExecutionId",
  requireAdminPermission("job.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = paramId(req.params.jobExecutionId);
      const filter: Record<string, unknown> = { jobExecutionId: id };
      if (!canReadAll(req)) filter.tenantId = tenantId(req);
      const doc = await JobExecution.findOne(filter).lean();
      if (!doc) {
        res.status(404).json({ success: false, error: "Not found" });
        return;
      }
      res.json({ success: true, data: redactJobDoc(doc as Record<string, unknown>) });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get("/jobs/dead-letters", requireAdminPermission("job.dead_letter.manage"), async (req: AuthRequest, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (!canReadAll(req)) filter.tenantId = tenantId(req);
    else if (typeof req.query.tenantId === "string") filter.tenantId = req.query.tenantId.toLowerCase();
    if (q.jobName) filter.jobName = q.jobName;

    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      JobDeadLetter.find(filter).sort({ deadLetteredAt: -1 }).skip(skip).limit(q.limit).lean(),
      JobDeadLetter.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items.map((i) => redactJobDoc(i as Record<string, unknown>)),
      meta: { page: q.page, limit: q.limit, total },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/jobs/schedules", requireAdminPermission("job.read"), async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {};
    if (!canReadAll(req)) filter.tenantId = { $in: [tenantId(req), "system"] };
    const items = await JobSchedule.find(filter).sort({ name: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (err) {
    sendDomainError(res, err);
  }
});

const enqueueSchema = z.object({
  jobName: z.string().min(3).max(128),
  tenantId: z.string().min(1).max(64).optional(),
  appKey: z.enum(["main", "challenge", "admin"]).optional(),
  payload: z.record(z.unknown()).default({}),
  delayMs: z.number().int().min(0).max(86_400_000).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  idempotencyKey: z.string().max(256).optional(),
  attempts: z.number().int().min(1).max(20).optional(),
});

router.post("/jobs/enqueue", requireAdminPermission("job.enqueue"), async (req: AuthRequest, res: Response) => {
  try {
    const body = enqueueSchema.parse(req.body);
    if (!JOB_NAME_SET.has(body.jobName)) {
      res.status(400).json({ success: false, error: "Unknown job name" });
      return;
    }
    // Never trust client tenant for privileged system jobs without explicit admin scope
    const tid = body.tenantId?.toLowerCase() || tenantId(req);
    const result = await enqueueNamedJob(
      body.jobName,
      {
        tenantId: tid,
        appKey: body.appKey ?? "admin",
        payload: body.payload,
        idempotencyKey: body.idempotencyKey,
        priority: body.priority,
        actorType: "admin",
        actorId: actorContext(req).actorId,
      },
      { delayMs: body.delayMs, priority: body.priority, attempts: body.attempts }
    );
    await writeDomainAudit({
      ...actorContext(req),
      action: "job.enqueued",
      entity: "job",
      entityId: result.jobId,
      metadata: { jobName: body.jobName, bullJobId: result.bullJobId },
    });
    res.status(202).json({ success: true, data: result });
  } catch (err) {
    sendDomainError(res, err);
  }
});

const cancelSchema = z.object({
  jobId: z.string().min(8).max(64),
  reason: z.string().max(500).optional(),
  queueName: z.string().max(64).optional(),
  bullJobId: z.string().max(128).optional(),
});

router.post("/jobs/cancel", requireAdminPermission("job.cancel"), async (req: AuthRequest, res: Response) => {
  try {
    const body = cancelSchema.parse(req.body);
    if (body.queueName && !QUEUE_NAME_SET.has(body.queueName)) {
      res.status(400).json({ success: false, error: "Unknown queue" });
      return;
    }
    await cancelJob({
      jobId: body.jobId,
      tenantId: tenantId(req),
      reason: body.reason,
      cancelledBy: actorContext(req).actorId,
      queueName: body.queueName as QueueName | undefined,
      bullJobId: body.bullJobId,
    });
    await writeDomainAudit({
      ...actorContext(req),
      action: "job.cancelled",
      entity: "job",
      entityId: body.jobId,
      metadata: { reason: body.reason },
    });
    res.json({ success: true, data: { jobId: body.jobId, cancelled: true } });
  } catch (err) {
    sendDomainError(res, err);
  }
});

/** Convenience: enqueue system health ping */
router.post("/jobs/ping", requireAdminPermission("job.enqueue"), async (req: AuthRequest, res: Response) => {
  try {
    const result = await enqueueNamedJob(JOB_NAMES.SYSTEM_HEALTH_PING, {
      tenantId: tenantId(req),
      appKey: "admin",
      payload: { source: "admin" },
      actorType: "admin",
      actorId: actorContext(req).actorId,
    });
    res.status(202).json({ success: true, data: result });
  } catch (err) {
    sendDomainError(res, err);
  }
});

export default router;
