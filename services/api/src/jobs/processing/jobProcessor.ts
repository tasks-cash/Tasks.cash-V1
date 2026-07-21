/**
 * Job processor — idempotency, cancellation, progress, timeout, DLQ persistence.
 */

import type { Job } from "bullmq";
import { runWithContext } from "../../observability/context";
import { logger } from "../../observability/logger";
import type { JobEnvelope } from "../contracts/jobEnvelope";
import { classifyJobError, JobIdempotencyError, JobTimeoutError } from "../contracts/jobErrors";
import { getJobHandler } from "../registry/jobRegistry";
import { getJobsConfig } from "../config/jobConfig";
import { JobCancellation, JobDeadLetter, JobExecution } from "../persistence/jobModels";
import { jobsMetrics } from "../jobsMetrics";
import { generatePublicId } from "../../domain/shared/publicId";

async function isCancelled(jobId: string): Promise<boolean> {
  const doc = await JobCancellation.findOne({ jobId }).lean();
  return Boolean(doc);
}

export async function processBullJob(job: Job<JobEnvelope>): Promise<Record<string, unknown>> {
  const envelope = job.data;
  const cfg = getJobsConfig();
  const attempt = job.attemptsMade + 1;
  const startedAt = new Date();

  if (await isCancelled(envelope.jobId)) {
    jobsMetrics.cancelled();
    logger.info("jobs.cancelled", {
      jobId: envelope.jobId,
      jobName: envelope.jobName,
      tenantId: envelope.tenantId,
      status: "cancelled",
      correlationId: envelope.correlationId,
    });
    return { skipped: true, reason: "cancelled" };
  }

  // Idempotency: prior successful execution with same idempotency key
  if (envelope.idempotencyKey) {
    const prior = await JobExecution.findOne({
      tenantId: envelope.tenantId,
      idempotencyKey: envelope.idempotencyKey,
      status: "completed",
    }).lean();
    if (prior) {
      jobsMetrics.skipped();
      logger.info("jobs.skipped_idempotent", {
        jobId: envelope.jobId,
        jobName: envelope.jobName,
        tenantId: envelope.tenantId,
        status: "skipped",
        correlationId: envelope.correlationId,
      });
      return { skipped: true, reason: "already_processed" };
    }
  }

  // Prefer the canonical enqueue-time reservation (same jobId / idempotencyKey).
  let executionId: string;
  const existing = await JobExecution.findOne({
    $or: [
      { jobId: envelope.jobId },
      ...(envelope.idempotencyKey
        ? [{ tenantId: envelope.tenantId, idempotencyKey: envelope.idempotencyKey }]
        : []),
    ],
  });

  if (existing) {
    if (existing.status === "completed") {
      jobsMetrics.skipped();
      return { skipped: true, reason: "already_processed" };
    }
    executionId = existing.jobExecutionId;
    await JobExecution.updateOne(
      { _id: existing._id },
      {
        $set: {
          status: "active",
          attempt,
          bullJobId: String(job.id),
          startedAt,
          requestId: envelope.requestId,
          correlationId: envelope.correlationId,
          envelope: { ...envelope },
        },
      }
    );
  } else {
    executionId = generatePublicId("jobExecution");
    try {
      await JobExecution.create({
        jobExecutionId: executionId,
        bullJobId: String(job.id),
        jobId: envelope.jobId,
        jobName: envelope.jobName,
        queueName: envelope.queueName,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        status: "active",
        attempt,
        idempotencyKey: envelope.idempotencyKey,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        startedAt,
        envelope: { ...envelope },
      });
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
        // Race: another worker activated the canonical row — re-read and continue or skip
        const raced = await JobExecution.findOne({
          tenantId: envelope.tenantId,
          ...(envelope.idempotencyKey
            ? { idempotencyKey: envelope.idempotencyKey }
            : { jobId: envelope.jobId }),
        });
        if (raced?.status === "completed") {
          jobsMetrics.skipped();
          return { skipped: true, reason: "already_processed" };
        }
        if (raced) {
          executionId = raced.jobExecutionId;
          await JobExecution.updateOne(
            { _id: raced._id },
            {
              $set: {
                status: "active",
                attempt,
                bullJobId: String(job.id),
                startedAt,
                envelope: { ...envelope },
              },
            }
          );
        } else {
          jobsMetrics.skipped();
          throw new JobIdempotencyError();
        }
      } else {
        throw err;
      }
    }
  }

  const handler = getJobHandler(envelope.jobName);
  if (!handler) {
    const msg = `No handler registered for ${envelope.jobName}`;
    await failExecution(executionId, envelope, attempt, startedAt, "NO_HANDLER", msg, true);
    throw new Error(msg);
  }

  const timeoutMs = handler.timeoutMs ?? cfg.defaultTimeoutMs;
  const controller = new AbortController();

  logger.info("jobs.handler.started", {
    jobId: envelope.jobId,
    jobName: envelope.jobName,
    queueName: envelope.queueName,
    tenantId: envelope.tenantId,
    appKey: envelope.appKey,
    attempt,
    requestId: envelope.requestId,
    correlationId: envelope.correlationId,
    status: "active",
  });

  try {
    const result = await runWithContext(
      {
        requestId: envelope.requestId ?? envelope.jobId,
        correlationId: envelope.correlationId ?? envelope.requestId ?? envelope.jobId,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        method: "JOB",
        route: `jobs/${envelope.jobName}`,
      },
      async () => {
        const work = handler.handler(envelope, {
          attempt,
          signal: controller.signal,
          updateProgress: async (progress) => {
            await job.updateProgress(progress);
            await JobExecution.updateOne(
              { jobExecutionId: executionId },
              { $set: { progress: typeof progress === "number" ? { percent: progress } : progress } }
            );
          },
        });
        let timer: NodeJS.Timeout | undefined;
        const cancellationPoll = setInterval(() => {
          void isCancelled(envelope.jobId).then((cancelled) => {
            if (cancelled) controller.abort();
          }).catch(() => undefined);
        }, 500);
        cancellationPoll.unref();
        try {
          return await Promise.race([
            work,
            new Promise<never>((_, reject) => {
              timer = setTimeout(() => {
                controller.abort();
                reject(new JobTimeoutError(envelope.jobName, timeoutMs));
              }, timeoutMs);
            }),
          ]);
        } finally {
          if (timer) clearTimeout(timer);
          clearInterval(cancellationPoll);
        }
      }
    );

    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    await JobExecution.updateOne(
      { jobExecutionId: executionId },
      {
        $set: {
          status: "completed",
          completedAt,
          durationMs,
          result: (result as Record<string, unknown>) ?? { ok: true },
        },
      }
    );
    jobsMetrics.completed();
    logger.info("jobs.handler.completed", {
      jobId: envelope.jobId,
      jobName: envelope.jobName,
      tenantId: envelope.tenantId,
      attempt,
      durationMs,
      status: "completed",
      correlationId: envelope.correlationId,
    });
    return (result as Record<string, unknown>) ?? { ok: true };
  } catch (err) {
    const failureClass = classifyJobError(err);
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 2000);
    const code =
      err instanceof Error && "code" in err ? String((err as { code: string }).code) : "JOB_ERROR";

    if (failureClass === "already_processed" || failureClass === "cancelled") {
      await JobExecution.updateOne(
        { jobExecutionId: executionId },
        {
          $set: {
            status: failureClass === "cancelled" ? "cancelled" : "skipped",
            completedAt: new Date(),
            errorCode: code,
            errorMessage: msg,
          },
        }
      );
      if (failureClass === "cancelled") jobsMetrics.cancelled();
      else jobsMetrics.skipped();
      return { skipped: true, reason: failureClass };
    }

    const maxAttempts = job.opts.attempts ?? cfg.defaultAttempts;
    const isFinal = attempt >= maxAttempts || failureClass === "permanent";

    await failExecution(executionId, envelope, attempt, startedAt, code, msg, isFinal);

    if (isFinal) {
      await JobDeadLetter.create({
        jobDeadLetterId: generatePublicId("jobDeadLetter"),
        jobId: envelope.jobId,
        jobName: envelope.jobName,
        queueName: envelope.queueName,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        attempts: attempt,
        lastError: msg,
        envelope: { ...envelope },
        bullJobId: String(job.id),
        correlationId: envelope.correlationId,
        deadLetteredAt: new Date(),
      });
      jobsMetrics.deadLetter();
      logger.error("jobs.dead_lettered", {
        jobId: envelope.jobId,
        jobName: envelope.jobName,
        tenantId: envelope.tenantId,
        attempt,
        status: "dead_lettered",
        errorCode: code,
        correlationId: envelope.correlationId,
      });
    } else {
      jobsMetrics.retried();
      jobsMetrics.failed(msg);
      logger.warn("jobs.handler.retried", {
        jobId: envelope.jobId,
        jobName: envelope.jobName,
        tenantId: envelope.tenantId,
        attempt,
        status: "retry",
        errorCode: code,
      });
    }
    throw err;
  }
}

async function failExecution(
  executionId: string,
  envelope: JobEnvelope,
  attempt: number,
  startedAt: Date,
  code: string,
  msg: string,
  dead: boolean
) {
  const completedAt = new Date();
  await JobExecution.updateOne(
    { jobExecutionId: executionId },
    {
      $set: {
        status: dead ? "dead_lettered" : "failed",
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        errorCode: code,
        errorMessage: msg,
        attempt,
      },
    }
  );
  void envelope;
}
