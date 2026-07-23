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
    jobName: JOB_NAMES.MIRAAJ_DISTRIBUTION_INBOX_PROCESS,
    version: "1", description: "Process one durable Miraaj distribution callback", timeoutMs: 60_000,
    handler: async (envelope) => {
      const eventId = String(envelope.payload.eventId ?? "");
      if (!eventId) throw new JobPermanentError("eventId required");
      const { processInboxEvent } = await import("../../miraajDistribution/inboxService");
      return processInboxEvent(eventId, `job:${envelope.jobId}`);
    },
  });
  registerJobHandler({
    jobName: JOB_NAMES.MIRAAJ_DISTRIBUTION_ASSIGNMENT_RECONCILE,
    version: "1", description: "Reconcile Miraaj distribution assignments without rewards", timeoutMs: 300_000,
    handler: async () => (await import("../../miraajDistribution/reconciliationService")).reconcileAssignments(),
  });
  registerJobHandler({
    jobName: JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_RECONCILE,
    version: "1", description: "Reconcile Miraaj proof states without rewards", timeoutMs: 300_000,
    handler: async () => (await import("../../miraajDistribution/reconciliationService")).reconcileProofs(),
  });
  registerJobHandler({
    jobName: JOB_NAMES.MIRAAJ_DISTRIBUTION_INBOX_RECOVER,
    version: "1", description: "Recover durable Miraaj inbox events", timeoutMs: 300_000,
    handler: async () => (await import("../../miraajDistribution/reconciliationService")).recoverInbox(),
  });
  for (const jobName of [
    JOB_NAMES.MIRAAJ_DISTRIBUTION_ASSIGNMENT_REQUEST,
    JOB_NAMES.MIRAAJ_DISTRIBUTION_ASSIGNMENT_CANCEL,
    JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_UPLOAD_SESSION,
    JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_COMPLETE,
    JOB_NAMES.MIRAAJ_DISTRIBUTION_PROOF_POLL,
  ]) {
    registerJobHandler({
      jobName, version: "1", description: "Miraaj distribution idempotent orchestration job", timeoutMs: 120_000,
      handler: async (envelope) => ({ accepted: true, operation: envelope.jobName, idempotent: true, rewardIssued: false }),
    });
  }

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
    jobName: JOB_NAMES.CAMPAIGN_INTELLIGENCE_GENERATE,
    version: "1",
    description: "Campaign Intelligence strategy/package generation pipeline",
    timeoutMs: 600_000,
    handler: async (envelope, ctx) => {
      const campaignId = String(envelope.payload.campaignId ?? "");
      const generationRunId = String(envelope.payload.generationRunId ?? "");
      if (!campaignId || !generationRunId) {
        throw new JobPermanentError("campaignId and generationRunId required");
      }
      const { runCampaignIntelligencePipeline } = await import(
        "../../campaignIntelligence/pipeline/runner"
      );
      return runCampaignIntelligencePipeline({
        tenantId: envelope.tenantId,
        campaignId,
        generationRunId,
        jobId: envelope.jobId,
        correlationId: envelope.correlationId,
        signal: ctx.signal,
      });
    },
  });

  registerJobHandler({ jobName: JOB_NAMES.MIRAAJ_SUBMIT, version:"1", description:"Submit a canonical execution to Miraaj AI", timeoutMs:120_000, handler:async(envelope,ctx)=>{const id=String(envelope.payload.executionId??"");if(!id)throw new JobPermanentError("executionId required");const {submitExecution}=await import("../../miraaj/service");const doc=await submitExecution(envelope.tenantId,id,ctx.signal);return {executionId:doc.executionId,status:doc.localStatus};} });
  registerJobHandler({ jobName: JOB_NAMES.MIRAAJ_SYNCHRONIZE, version:"1", description:"Synchronize a Miraaj execution", timeoutMs:60_000, handler:async(envelope,ctx)=>{const id=String(envelope.payload.executionId??"");if(!id)throw new JobPermanentError("executionId required");const {synchronizeExecution}=await import("../../miraaj/service");const doc=await synchronizeExecution(envelope.tenantId,id,ctx.signal);return {executionId:doc.executionId,status:doc.localStatus};} });
  registerJobHandler({ jobName: JOB_NAMES.MIRAAJ_CANCEL, version:"1", description:"Cancel a Miraaj execution", timeoutMs:60_000, handler:async(envelope)=>{const id=String(envelope.payload.executionId??"");if(!id)throw new JobPermanentError("executionId required");const {cancelExecution}=await import("../../miraaj/service");const doc=await cancelExecution(envelope.tenantId,id,envelope.actorId??"system");return {executionId:doc.executionId,status:doc.localStatus};} });
  registerJobHandler({ jobName: JOB_NAMES.MIRAAJ_RECONCILE, version:"1", description:"Recover stale Miraaj executions", timeoutMs:300_000, handler:async()=>{const {withDistributedLock}=await import("../processing/distributedLock");return withDistributedLock("miraaj-reconciliation",240_000,async()=>{const {MiraajExecution}=await import("../../miraaj/models");const {enqueueNamedJob}=await import("../enqueue");const stale=await MiraajExecution.find({localStatus:{$in:["accepted","queued","running","synchronization_required"]},updatedAt:{$lt:new Date(Date.now()-60_000)}}).limit(100).lean();for(const item of stale){await enqueueNamedJob(JOB_NAMES.MIRAAJ_SYNCHRONIZE,{tenantId:item.tenantId,appKey:"admin",idempotencyKey:`miraaj:sync:${item.executionId}:${Math.floor(Date.now()/60000)}`,correlationId:item.correlationId,payload:{executionId:item.executionId}});}logger.info("miraaj.reconciliation.completed",{scheduled:stale.length});return {scheduled:stale.length};});} });

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
