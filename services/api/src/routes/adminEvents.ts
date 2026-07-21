/**
 * Admin APIs for durable events and workflow runs.
 */
import { Router, Response } from "express";
import { z } from "zod";
import {
  authMiddleware,
  adminMiddleware,
  requireAdminPermission,
  AuthRequest,
} from "../middleware/auth";
import { DomainEvent } from "../events/models/DomainEvent";
import { OutboxEvent } from "../events/models/OutboxEvent";
import { EventHandlerExecution } from "../events/models/EventHandlerExecution";
import { retryOutboxEvent, cancelOutboxEvent } from "../events/eventDispatcher";
import { listRegisteredEventTypes } from "../events/eventRegistry";
import { listRegisteredHandlers } from "../events/eventBus";
import { sanitizeEventValue } from "../events/eventEnvelope";
import { WorkflowRun, WorkflowStepExecution } from "../workflows/workflowModels";
import { listWorkflows } from "../workflows/workflowDefinition";
import {
  cancelWorkflowRun,
  resumeWorkflowRun,
  retryWorkflowRun,
} from "../workflows/workflowEngine";
import { writeDomainAudit } from "../domain/services/domainAudit";
import { actorContext, sendDomainError } from "../domain/http/adminHelpers";
import { DEFAULT_TENANT } from "../domain/shared/baseSchema";

const router = Router();
router.use(authMiddleware, adminMiddleware);

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().max(64).optional(),
  eventType: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "occurredAt", "updatedAt"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function tenantId(req: AuthRequest): string {
  return (req.headers["x-tenant-id"] as string)?.toLowerCase() || DEFAULT_TENANT;
}

function canReadAll(req: AuthRequest): boolean {
  const perms = (req.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  return perms.includes("system.full_access") || perms.includes("system.event.read_all");
}

function redactEnvelope(doc: Record<string, unknown>) {
  const copy = { ...doc };
  if (copy.payload) copy.payload = sanitizeEventValue(copy.payload);
  if (copy.metadata) copy.metadata = sanitizeEventValue(copy.metadata);
  if (copy.envelope && typeof copy.envelope === "object") {
    const env = { ...(copy.envelope as Record<string, unknown>) };
    if (env.payload) env.payload = sanitizeEventValue(env.payload);
    if (env.metadata) env.metadata = sanitizeEventValue(env.metadata);
    copy.envelope = env;
  }
  return copy;
}

router.get("/events", requireAdminPermission("event.read"), async (req: AuthRequest, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = {};
    if (!canReadAll(req)) filter.tenantId = tenantId(req);
    else if (typeof req.query.tenantId === "string") filter.tenantId = req.query.tenantId.toLowerCase();
    if (q.status) filter.status = q.status;
    if (q.eventType) filter.eventType = q.eventType;

    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      DomainEvent.find(filter)
        .sort({ [q.sortBy]: q.sortDir === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(q.limit)
        .lean(),
      DomainEvent.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items.map((i) => redactEnvelope(i as Record<string, unknown>)),
      meta: { page: q.page, limit: q.limit, total, registeredTypes: listRegisteredEventTypes().length },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/events/dead-letter", requireAdminPermission("event.dead_letter.manage"), async (req: AuthRequest, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = { status: "dead_lettered" };
    if (!canReadAll(req)) filter.tenantId = tenantId(req);
    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      OutboxEvent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
      OutboxEvent.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items.map((i) => redactEnvelope(i as Record<string, unknown>)),
      meta: { page: q.page, limit: q.limit, total },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/events/:eventId", requireAdminPermission("event.read"), async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = { eventId: paramId(req.params.eventId) };
    if (!canReadAll(req)) filter.tenantId = tenantId(req);
    const doc = await DomainEvent.findOne(filter).lean();
    if (!doc) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }
    res.json({ success: true, data: redactEnvelope(doc as Record<string, unknown>) });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/events/:eventId/handlers", requireAdminPermission("event.read"), async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = { eventId: paramId(req.params.eventId) };
    if (!canReadAll(req)) filter.tenantId = tenantId(req);
    const event = await DomainEvent.findOne(filter).lean();
    if (!event) {
      res.status(404).json({ success: false, error: "Event not found" });
      return;
    }
    const executions = await EventHandlerExecution.find({ eventId: paramId(req.params.eventId) }).lean();
    res.json({
      success: true,
      data: {
        registered: listRegisteredHandlers().filter(
          (h) => h.eventType === event.eventType || h.eventType === "*"
        ),
        executions,
      },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/events/:eventId/retry", requireAdminPermission("event.retry"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const tid = canReadAll(req) ? undefined : tenantId(req);
    const ok = await retryOutboxEvent(paramId(req.params.eventId), tid);
    if (!ok) {
      res.status(404).json({ success: false, error: "Event not retryable" });
      return;
    }
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainEvent",
      entityId: paramId(req.params.eventId),
      action: "event.retry",
      after: { status: "pending" },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    res.json({ success: true, data: { eventId: paramId(req.params.eventId), status: "pending" } });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post("/events/:eventId/cancel", requireAdminPermission("event.cancel"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const tid = canReadAll(req) ? undefined : tenantId(req);
    const ok = await cancelOutboxEvent(paramId(req.params.eventId), tid);
    if (!ok) {
      res.status(404).json({ success: false, error: "Event not cancellable" });
      return;
    }
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainEvent",
      entityId: paramId(req.params.eventId),
      action: "event.cancel",
      after: { status: "cancelled" },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    res.json({ success: true, data: { eventId: paramId(req.params.eventId), status: "cancelled" } });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post(
  "/events/dead-letter/:eventId/retry",
  requireAdminPermission("event.dead_letter.manage"),
  async (req: AuthRequest, res: Response) => {
    try {
      const ctx = actorContext(req);
      const tid = canReadAll(req) ? undefined : tenantId(req);
      const ok = await retryOutboxEvent(paramId(req.params.eventId), tid);
      if (!ok) {
        res.status(404).json({ success: false, error: "Dead-letter event not found" });
        return;
      }
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainEvent",
        entityId: paramId(req.params.eventId),
        action: "event.dead_letter.retry",
        after: { status: "pending" },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      res.json({ success: true, data: { eventId: paramId(req.params.eventId), status: "pending" } });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.get("/workflows", requireAdminPermission("workflow.read"), async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        definitions: listWorkflows().map((w) => ({
          name: w.name,
          version: w.version,
          description: w.description,
          triggerEventTypes: w.triggerEventTypes,
          stepCount: w.steps.length,
        })),
        handlers: listRegisteredHandlers().filter((h) => h.name.startsWith("workflow.")).length,
      },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/workflows/definitions", requireAdminPermission("workflow.read"), async (_req, res: Response) => {
  res.json({
    success: true,
    data: listWorkflows().map((w) => ({
      name: w.name,
      version: w.version,
      description: w.description,
      triggerEventTypes: w.triggerEventTypes,
      steps: w.steps.map((s) => ({
        name: s.name,
        version: s.version,
        optional: s.optional,
        requiresCompensation: s.requiresCompensation,
      })),
    })),
  });
});

router.get("/workflows/runs", requireAdminPermission("workflow.read"), async (req: AuthRequest, res: Response) => {
  try {
    const q = paginationSchema.parse(req.query);
    const filter: Record<string, unknown> = {};
    const perms = (req.user as { permissions?: string[] } | undefined)?.permissions ?? [];
    const readAll =
      perms.includes("system.full_access") || perms.includes("system.workflow.read_all");
    if (!readAll) filter.tenantId = tenantId(req);
    if (q.status) filter.status = q.status;
    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      WorkflowRun.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit).lean(),
      WorkflowRun.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items.map((i) => {
        const c = { ...i } as Record<string, unknown>;
        if (c.context) c.context = sanitizeEventValue(c.context);
        return c;
      }),
      meta: { page: q.page, limit: q.limit, total },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get(
  "/workflows/runs/:workflowRunId",
  requireAdminPermission("workflow.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const filter: Record<string, unknown> = { workflowRunId: paramId(req.params.workflowRunId) };
      const perms = (req.user as { permissions?: string[] } | undefined)?.permissions ?? [];
      if (!perms.includes("system.full_access") && !perms.includes("system.workflow.read_all")) {
        filter.tenantId = tenantId(req);
      }
      const run = await WorkflowRun.findOne(filter).lean();
      if (!run) {
        res.status(404).json({ success: false, error: "Workflow run not found" });
        return;
      }
      const steps = await WorkflowStepExecution.find({ workflowRunId: run.workflowRunId }).lean();
      res.json({
        success: true,
        data: {
          run: { ...run, context: sanitizeEventValue(run.context) },
          steps,
        },
      });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/workflows/runs/:workflowRunId/retry",
  requireAdminPermission("workflow.retry"),
  async (req: AuthRequest, res: Response) => {
    try {
      const ctx = actorContext(req);
      const tid = tenantId(req);
      await retryWorkflowRun(paramId(req.params.workflowRunId), tid);
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "WorkflowRun",
        entityId: paramId(req.params.workflowRunId),
        action: "workflow.retry",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      res.json({ success: true, data: { workflowRunId: paramId(req.params.workflowRunId), status: "retried" } });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/workflows/runs/:workflowRunId/cancel",
  requireAdminPermission("workflow.cancel"),
  async (req: AuthRequest, res: Response) => {
    try {
      const ctx = actorContext(req);
      const ok = await cancelWorkflowRun(paramId(req.params.workflowRunId), tenantId(req));
      if (!ok) {
        res.status(404).json({ success: false, error: "Workflow not cancellable" });
        return;
      }
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "WorkflowRun",
        entityId: paramId(req.params.workflowRunId),
        action: "workflow.cancel",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      res.json({ success: true, data: { workflowRunId: paramId(req.params.workflowRunId), status: "cancelled" } });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

router.post(
  "/workflows/runs/:workflowRunId/resume",
  requireAdminPermission("workflow.resume"),
  async (req: AuthRequest, res: Response) => {
    try {
      const ctx = actorContext(req);
      const filter: Record<string, unknown> = { workflowRunId: paramId(req.params.workflowRunId) };
      filter.tenantId = tenantId(req);
      const run = await WorkflowRun.findOne(filter).lean();
      if (!run) {
        res.status(404).json({ success: false, error: "Workflow run not found" });
        return;
      }
      await resumeWorkflowRun(paramId(req.params.workflowRunId));
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "WorkflowRun",
        entityId: paramId(req.params.workflowRunId),
        action: "workflow.resume",
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      res.json({ success: true, data: { workflowRunId: paramId(req.params.workflowRunId), status: "resumed" } });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

export default router;
