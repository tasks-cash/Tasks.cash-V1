/**
 * Built-in job handlers — outbox dispatch, system ping, cleanup, and integration stubs.
 */

import { registerJobHandler } from "../registry/jobRegistry";
import { JOB_NAMES } from "../contracts/jobTypes";
import { JobPermanentError, JobRetryableError } from "../contracts/jobErrors";
import { JobDeadLetter, JobExecution } from "../persistence/jobModels";
import { getJobsConfig } from "../config/jobConfig";
import { logger } from "../../observability/logger";

let registered = false;

function testHandlersEnabled(): boolean {
  return (
    process.env.JOBS_ENABLE_TEST_HANDLERS === "true" ||
    process.env.JOBS_ENABLE_TEST_HANDLERS === "1" ||
    process.env.NODE_ENV === "test"
  );
}

export function registerBuiltinJobHandlers(): void {
  if (registered) return;
  registered = true;

  registerJobHandler({
    jobName: JOB_NAMES.OUTBOX_DISPATCH,
    version: "1",
    description: "Process a claimed outbox document via durable event handlers",
    timeoutMs: 180_000,
    handler: async (envelope) => {
      const outboxId = String(envelope.payload.outboxId ?? "");
      if (!outboxId) throw new JobPermanentError("outboxId required");
      const { OutboxEvent } = await import("../../events/models/OutboxEvent");
      const doc = await OutboxEvent.findOne({ outboxId });
      if (!doc) throw new JobPermanentError(`Outbox not found: ${outboxId}`);
      if (doc.status !== "processing") {
        return { status: doc.status, skipped: true };
      }
      const { processOutboxDocument } = await import("../../events/eventDispatcher");
      await processOutboxDocument(doc);
      return { outboxId, eventId: doc.eventId, status: "processed" };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.SYSTEM_HEALTH_PING,
    version: "1",
    description: "Lightweight health ping for worker verification",
    timeoutMs: 5_000,
    handler: async (envelope, ctx) => {
      await ctx.updateProgress(100);
      return { ok: true, tenantId: envelope.tenantId, at: new Date().toISOString() };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.SYSTEM_CLEANUP,
    version: "1",
    description: "Retain job execution and dead-letter documents",
    timeoutMs: 120_000,
    handler: async () => {
      const cfg = getJobsConfig();
      const execCutoff = new Date(Date.now() - cfg.retentionDays * 86_400_000);
      const dlCutoff = new Date(Date.now() - cfg.deadLetterRetentionDays * 86_400_000);
      const [execRes, dlRes] = await Promise.all([
        JobExecution.deleteMany({
          createdAt: { $lt: execCutoff },
          status: { $in: ["completed", "skipped", "cancelled"] },
        }),
        JobDeadLetter.deleteMany({ deadLetteredAt: { $lt: dlCutoff } }),
      ]);
      logger.info("jobs.cleanup.completed", {
        executionsDeleted: execRes.deletedCount,
        deadLettersDeleted: dlRes.deletedCount,
        status: "ok",
      });
      return {
        executionsDeleted: execRes.deletedCount,
        deadLettersDeleted: dlRes.deletedCount,
      };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.WORKFLOW_RUN,
    version: "1",
    description: "Execute or resume a workflow run (bridge)",
    timeoutMs: 300_000,
    handler: async (envelope) => {
      const { resumeWorkflowRun } = await import("../../workflows/workflowEngine");
      const runId = String(envelope.payload.runId ?? "");
      if (!runId) throw new JobPermanentError("runId required");
      await resumeWorkflowRun(runId);
      return { runId, resumed: true };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.WORKFLOW_RESUME,
    version: "1",
    description: "Resume a workflow run",
    timeoutMs: 300_000,
    handler: async (envelope) => {
      const { resumeWorkflowRun } = await import("../../workflows/workflowEngine");
      const runId = String(envelope.payload.runId ?? "");
      if (!runId) throw new JobPermanentError("runId required");
      await resumeWorkflowRun(runId);
      return { runId, resumed: true };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.ANALYTICS_CLEANUP,
    version: "1",
    description: "Run analytics retention cleanup",
    timeoutMs: 300_000,
    handler: async (envelope) => {
      const { cleanupAnalyticsData } = await import("../../analytics/analyticsCleanup");
      const tenantId =
        typeof envelope.payload.tenantId === "string" ? envelope.payload.tenantId : undefined;
      const result = await cleanupAnalyticsData({ tenantId });
      return { ...result };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.ANALYTICS_AGGREGATE,
    version: "1",
    description: "Refresh analytics aggregates (foundation)",
    timeoutMs: 300_000,
    handler: async () => ({ ok: true, note: "aggregate_stub" }),
  });

  registerJobHandler({
    jobName: JOB_NAMES.NOTIFICATION_DELIVER,
    version: "1",
    description: "Deliver a domain notification (foundation)",
    timeoutMs: 60_000,
    handler: async (envelope) => {
      const notificationId = envelope.payload.notificationId;
      return { notificationId, delivered: false, note: "delivery_stub" };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.LEADERBOARD_REBUILD,
    version: "1",
    description: "Rebuild a season leaderboard (foundation)",
    timeoutMs: 300_000,
    handler: async (envelope) => ({
      seasonId: envelope.payload.seasonId,
      rebuilt: false,
      note: "rebuild_stub",
    }),
  });

  registerJobHandler({
    jobName: JOB_NAMES.REWARD_ISSUE,
    version: "1",
    description: "Issue a reward asynchronously (foundation)",
    timeoutMs: 120_000,
    handler: async (envelope) => ({
      rewardId: envelope.payload.rewardId,
      issued: false,
      note: "reward_stub",
    }),
  });

  registerJobHandler({
    jobName: JOB_NAMES.CACHE_INVALIDATE,
    version: "1",
    description: "Invalidate page-content cache by reason/pageKey",
    timeoutMs: 60_000,
    handler: async (envelope) => {
      const pageKey =
        typeof envelope.payload.pageKey === "string" ? envelope.payload.pageKey : undefined;
      if (!pageKey) throw new JobPermanentError("pageKey required");
      const { invalidateByReason } = await import("../../services/contentCacheInvalidation");
      const result = await invalidateByReason({
        kind: "page",
        pageKey,
        appKey: envelope.appKey,
      });
      return {
        pageKey,
        kind: "page",
        keysInvalidated: result.keysInvalidated,
        reason: result.reason,
      };
    },
  });

  registerJobHandler({
    jobName: JOB_NAMES.AI_JOB_PROCESS,
    version: "1",
    description: "Process an AI job request (no external providers in Phase 7)",
    timeoutMs: 300_000,
    handler: async (envelope) => ({
      aiJobId: envelope.payload.aiJobId,
      processed: false,
      note: "ai_stub",
    }),
  });

  registerJobHandler({
    jobName: JOB_NAMES.MEDIA_PROCESS,
    version: "1",
    description: "Process media (foundation)",
    timeoutMs: 300_000,
    handler: async (envelope) => ({
      mediaId: envelope.payload.mediaId,
      processed: false,
      note: "media_stub",
    }),
  });

  registerJobHandler({
    jobName: JOB_NAMES.EVENT_RETENTION_CLEANUP,
    version: "1",
    description: "Event retention cleanup bridge",
    timeoutMs: 300_000,
    handler: async () => ({ ok: true, note: "event_retention_stub" }),
  });

  registerJobHandler({
    jobName: JOB_NAMES.SYSTEM_TEST_ALWAYS_FAIL,
    version: "1",
    description: "Test-only always-fail job for Retry/DLQ acceptance (gated)",
    timeoutMs: 5_000,
    handler: async (envelope) => {
      if (!testHandlersEnabled()) {
        throw new JobPermanentError("system.test.always_fail is disabled outside test mode");
      }
      throw new JobRetryableError(
        `acceptance test forced failure (jobId=${envelope.jobId})`
      );
    },
  });
}

export function resetBuiltinHandlersFlagForTests(): void {
  registered = false;
}
