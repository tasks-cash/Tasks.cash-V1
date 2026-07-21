/**
 * Workflow engine: start / resume / cancel / compensate with persistence.
 */

import { generatePublicId } from "../domain/shared/publicId";
import { logger } from "../observability/logger";
import type { EventEnvelopeBase } from "../events/eventEnvelope";
import { EVENT_TYPES } from "../events/eventTypes";
import { emitDomainEvent } from "../events/eventPublisher";
import { eventMetrics } from "../events/eventMetrics";
import {
  WorkflowExecutionError,
  WorkflowTransitionError,
  classifyError,
} from "../events/eventErrors";
import {
  assertStepTimeout,
  findWorkflowsForEvent,
  getWorkflow,
  type WorkflowContext,
  type WorkflowDefinitionInMemory,
} from "./workflowDefinition";
import { WorkflowRun, WorkflowStepExecution } from "./workflowModels";

async function persistStepStart(
  ctx: WorkflowContext,
  stepName: string,
  stepVersion: string,
  attempt: number,
  input?: Record<string, unknown>
): Promise<string> {
  const id = generatePublicId("workflowStepExecution");
  try {
    await WorkflowStepExecution.create({
      workflowStepExecutionId: id,
      workflowRunId: ctx.workflowRunId,
      stepName,
      stepVersion,
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      status: "running",
      attempt,
      input,
      startedAt: new Date(),
    });
    return id;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      const existing = await WorkflowStepExecution.findOne({
        workflowRunId: ctx.workflowRunId,
        stepName,
        stepVersion,
      });
      if (existing?.status === "succeeded" || existing?.status === "skipped") {
        return existing.workflowStepExecutionId;
      }
      await WorkflowStepExecution.updateOne(
        { workflowStepExecutionId: existing!.workflowStepExecutionId },
        { $set: { status: "running", attempt, startedAt: new Date() }, $inc: {} }
      );
      return existing!.workflowStepExecutionId;
    }
    throw err;
  }
}

async function runSteps(
  def: WorkflowDefinitionInMemory,
  runId: string,
  trigger: EventEnvelopeBase,
  startFromIndex = 0
): Promise<void> {
  const startedAt = Date.now();
  const run = await WorkflowRun.findOne({ workflowRunId: runId });
  if (!run) throw new WorkflowExecutionError(`Workflow run not found: ${runId}`);
  if (run.status === "cancelled" || run.status === "completed") return;

  const ctx: WorkflowContext = {
    tenantId: run.tenantId,
    appKey: run.appKey,
    workflowRunId: runId,
    workflowName: def.name,
    workflowVersion: def.version,
    triggerEvent: trigger,
    requestId: run.requestId,
    correlationId: run.correlationId,
    data: { ...(run.context ?? {}) },
  };

  await WorkflowRun.updateOne(
    { workflowRunId: runId },
    { $set: { status: "running", startedAt: run.startedAt ?? new Date() } }
  );

  const succeededSteps: string[] = [];

  try {
    for (let i = startFromIndex; i < def.steps.length; i++) {
      const step = def.steps[i];
      const existing = await WorkflowStepExecution.findOne({
        workflowRunId: runId,
        stepName: step.name,
        stepVersion: step.version,
      }).lean();
      if (existing?.status === "succeeded" || existing?.status === "skipped") {
        succeededSteps.push(step.name);
        continue;
      }

      if (step.condition) {
        const ok = await step.condition(ctx);
        if (!ok) {
          await WorkflowStepExecution.findOneAndUpdate(
            { workflowRunId: runId, stepName: step.name, stepVersion: step.version },
            {
              $setOnInsert: {
                workflowStepExecutionId: generatePublicId("workflowStepExecution"),
                tenantId: ctx.tenantId,
                appKey: ctx.appKey,
              },
              $set: { status: "skipped", completedAt: new Date() },
            },
            { upsert: true }
          );
          continue;
        }
      }

      await WorkflowRun.updateOne({ workflowRunId: runId }, { $set: { currentStep: step.name } });
      logger.info("workflow.step.started", {
        workflowRunId: runId,
        workflowName: def.name,
        workflowVersion: def.version,
        stepName: step.name,
        tenantId: ctx.tenantId,
        appKey: ctx.appKey,
        requestId: ctx.requestId,
        correlationId: ctx.correlationId,
        status: "running",
      });

      const maxAttempts = step.maximumAttempts ?? 3;
      const timeoutMs = step.timeoutMs ?? 15_000;
      let lastErr: unknown;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const stepExecId = await persistStepStart(ctx, step.name, step.version, attempt);
        const t0 = Date.now();
        try {
          const result = await Promise.race([
            step.execute(ctx),
            assertStepTimeout(timeoutMs, step.name),
          ]);
          const durationMs = Date.now() - t0;
          await WorkflowStepExecution.updateOne(
            { workflowStepExecutionId: stepExecId },
            {
              $set: {
                status: "succeeded",
                completedAt: new Date(),
                durationMs,
                output: result?.output,
              },
            }
          );
          if (result?.output) Object.assign(ctx.data, result.output);
          await WorkflowRun.updateOne({ workflowRunId: runId }, { $set: { context: ctx.data } });
          succeededSteps.push(step.name);
          logger.info("workflow.step.completed", {
            workflowRunId: runId,
            workflowName: def.name,
            stepName: step.name,
            tenantId: ctx.tenantId,
            durationMs,
            status: "succeeded",
            correlationId: ctx.correlationId,
          });
          await emitDomainEvent({
            eventType: EVENT_TYPES.WORKFLOW_STEP_COMPLETED,
            tenantId: ctx.tenantId,
            appKey: ctx.appKey,
            aggregateType: "workflow",
            aggregateId: runId,
            payload: { workflowRunId: runId, stepName: step.name },
            causationId: trigger.eventId,
            correlationId: ctx.correlationId,
            requestId: ctx.requestId,
          }).catch(() => undefined);
          if (result?.skipRemaining) break;
          lastErr = undefined;
          break;
        } catch (err) {
          lastErr = err;
          const durationMs = Date.now() - t0;
          await WorkflowStepExecution.updateOne(
            { workflowStepExecutionId: stepExecId },
            {
              $set: {
                status: "failed",
                completedAt: new Date(),
                durationMs,
                error: (err instanceof Error ? err.message : String(err)).slice(0, 2000),
              },
            }
          );
          const fc = classifyError(err);
          if (fc === "retryable" && attempt < maxAttempts) continue;
          if (step.optional) {
            lastErr = undefined;
            break;
          }
          throw err;
        }
      }
      if (lastErr) throw lastErr;
    }

    await WorkflowRun.updateOne(
      { workflowRunId: runId },
      { $set: { status: "completed", completedAt: new Date(), currentStep: undefined } }
    );
    eventMetrics.workflowComplete(Date.now() - startedAt);
    logger.info("workflow.completed", {
      workflowRunId: runId,
      workflowName: def.name,
      workflowVersion: def.version,
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      requestId: ctx.requestId,
      correlationId: ctx.correlationId,
      status: "completed",
      durationMs: Date.now() - startedAt,
    });
    await emitDomainEvent({
      eventType: EVENT_TYPES.WORKFLOW_COMPLETED,
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      aggregateType: "workflow",
      aggregateId: runId,
      payload: { workflowRunId: runId, workflowName: def.name },
      causationId: trigger.eventId,
      correlationId: ctx.correlationId,
      requestId: ctx.requestId,
    }).catch(() => undefined);
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 2000);
    logger.error("workflow.step.failed", {
      workflowRunId: runId,
      workflowName: def.name,
      tenantId: ctx.tenantId,
      status: "failed",
      errorCode: "WORKFLOW_STEP",
      correlationId: ctx.correlationId,
    });

    // Compensation in reverse for steps that require it
    await WorkflowRun.updateOne(
      { workflowRunId: runId },
      { $set: { status: "compensating" } }
    );
    for (let i = succeededSteps.length - 1; i >= 0; i--) {
      const stepName = succeededSteps[i];
      const step = def.steps.find((s) => s.name === stepName);
      if (!step?.compensate || !step.requiresCompensation) continue;
      eventMetrics.compensate();
      try {
        await step.compensate(ctx);
        await WorkflowStepExecution.updateOne(
          { workflowRunId: runId, stepName: step.name },
          { $set: { status: "compensated" } }
        );
        logger.info("workflow.compensated", {
          workflowRunId: runId,
          stepName: step.name,
          tenantId: ctx.tenantId,
          status: "compensated",
        });
      } catch {
        logger.error("workflow.compensation_failed", {
          workflowRunId: runId,
          stepName: step.name,
          tenantId: ctx.tenantId,
          status: "failed",
        });
      }
    }

    await WorkflowRun.updateOne(
      { workflowRunId: runId },
      { $set: { status: "failed", failedAt: new Date(), error: msg } }
    );
    eventMetrics.workflowFail(Date.now() - startedAt);
    logger.error("workflow.failed", {
      workflowRunId: runId,
      workflowName: def.name,
      tenantId: ctx.tenantId,
      status: "failed",
      errorCode: "WORKFLOW_FAILED",
      correlationId: ctx.correlationId,
    });
    await emitDomainEvent({
      eventType: EVENT_TYPES.WORKFLOW_FAILED,
      tenantId: ctx.tenantId,
      appKey: ctx.appKey,
      aggregateType: "workflow",
      aggregateId: runId,
      payload: { workflowRunId: runId, workflowName: def.name, errorCode: "WORKFLOW_FAILED" },
      causationId: trigger.eventId,
      correlationId: ctx.correlationId,
      requestId: ctx.requestId,
    }).catch(() => undefined);
    throw err;
  }
}

export async function startWorkflowsForEvent(envelope: EventEnvelopeBase): Promise<string[]> {
  const defs = findWorkflowsForEvent(envelope.eventType);
  const runIds: string[] = [];
  for (const def of defs) {
    try {
      const existing = await WorkflowRun.findOne({
        tenantId: envelope.tenantId,
        triggerEventId: envelope.eventId,
        workflowName: def.name,
      }).lean();
      if (existing) {
        if (existing.status === "failed" || existing.status === "pending") {
          await resumeWorkflowRun(existing.workflowRunId);
        }
        runIds.push(existing.workflowRunId);
        continue;
      }

      const workflowRunId = generatePublicId("workflowRun");
      await WorkflowRun.create({
        workflowRunId,
        workflowDefinitionId: `mem:${def.name}@${def.version}`,
        workflowName: def.name,
        workflowVersion: def.version,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        triggerEventId: envelope.eventId,
        triggerEventType: envelope.eventType,
        status: "pending",
        context: { payload: envelope.payload },
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
      });
      eventMetrics.workflowStart();
      logger.info("workflow.started", {
        workflowRunId,
        workflowName: def.name,
        workflowVersion: def.version,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        causationId: envelope.eventId,
        status: "pending",
      });
      await emitDomainEvent({
        eventType: EVENT_TYPES.WORKFLOW_STARTED,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        aggregateType: "workflow",
        aggregateId: workflowRunId,
        payload: {
          workflowRunId,
          workflowName: def.name,
          triggerEventId: envelope.eventId,
        },
        causationId: envelope.eventId,
        correlationId: envelope.correlationId,
        requestId: envelope.requestId,
      }).catch(() => undefined);

      await runSteps(def, workflowRunId, envelope, 0);
      runIds.push(workflowRunId);
    } catch (err) {
      logger.error("workflow.start_failed", {
        workflowName: def.name,
        eventId: envelope.eventId,
        tenantId: envelope.tenantId,
        errorCode: err instanceof Error ? err.name : "Error",
      });
    }
  }
  return runIds;
}

export async function resumeWorkflowRun(workflowRunId: string): Promise<void> {
  const run = await WorkflowRun.findOne({ workflowRunId });
  if (!run) throw new WorkflowTransitionError(`Unknown run ${workflowRunId}`);
  if (run.status === "completed" || run.status === "cancelled") {
    throw new WorkflowTransitionError(`Cannot resume ${run.status} workflow`);
  }
  const def = getWorkflow(run.workflowName, run.workflowVersion);
  if (!def) throw new WorkflowExecutionError(`Definition missing for ${run.workflowName}`);

  const trigger = {
    eventId: run.triggerEventId,
    eventType: run.triggerEventType,
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    tenantId: run.tenantId,
    appKey: run.appKey,
    aggregateType: "workflow",
    aggregateId: run.workflowRunId,
    actorType: "system" as const,
    actorId: "workflow-engine",
    source: "workflow" as const,
    environment: process.env.NODE_ENV ?? "development",
    requestId: run.requestId,
    correlationId: run.correlationId,
    payload: (run.context?.payload as Record<string, unknown>) ?? {},
  };

  let startIdx = 0;
  if (run.currentStep) {
    const idx = def.steps.findIndex((s) => s.name === run.currentStep);
    if (idx >= 0) {
      const stepExec = await WorkflowStepExecution.findOne({
        workflowRunId,
        stepName: run.currentStep,
      }).lean();
      startIdx = stepExec?.status === "succeeded" ? idx + 1 : idx;
    }
  }
  await runSteps(def, workflowRunId, trigger, startIdx);
}

export async function cancelWorkflowRun(workflowRunId: string, tenantId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = {
    workflowRunId,
    status: { $in: ["pending", "running", "waiting", "failed"] },
  };
  if (tenantId) filter.tenantId = tenantId;
  const res = await WorkflowRun.updateOne(filter, {
    $set: { status: "cancelled", cancelledAt: new Date() },
  });
  if (res.modifiedCount) {
    logger.info("workflow.cancelled", {
      workflowRunId,
      tenantId,
      status: "cancelled",
    });
  }
  return res.modifiedCount > 0;
}

export async function retryWorkflowRun(workflowRunId: string, tenantId?: string): Promise<void> {
  const filter: Record<string, unknown> = { workflowRunId, status: { $in: ["failed", "cancelled"] } };
  if (tenantId) filter.tenantId = tenantId;
  const run = await WorkflowRun.findOne(filter);
  if (!run) throw new WorkflowTransitionError("Workflow run not retryable");
  await WorkflowRun.updateOne(
    { workflowRunId },
    { $set: { status: "pending", error: undefined, failedAt: undefined, cancelledAt: undefined } }
  );
  await resumeWorkflowRun(workflowRunId);
}
