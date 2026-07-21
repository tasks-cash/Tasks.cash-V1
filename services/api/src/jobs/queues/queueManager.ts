/**
 * Queue factory / manager — creates BullMQ queues with shared policies.
 */

import { Queue, type JobsOptions } from "bullmq";
import { getJobsConfig } from "../config/jobConfig";
import { getJobsRedisConnection } from "./jobsRedis";
import { QUEUE_NAMES, type QueueName, assertQueueName } from "./queueNames";
import { JobValidationError } from "../contracts/jobErrors";
import type { JobEnvelope } from "../contracts/jobEnvelope";
import { jobsMetrics } from "../jobsMetrics";
import { logger } from "../../observability/logger";

const queues = new Map<string, Queue>();

export function getQueue(name: QueueName): Queue | null {
  assertQueueName(name);
  const cfg = getJobsConfig();
  if (!cfg.enabled) return null;
  const existing = queues.get(name);
  if (existing) return existing;

  const connection = getJobsRedisConnection();
  if (!connection) return null;

  const queue = new Queue(name, {
    connection,
    prefix: cfg.prefix,
    defaultJobOptions: {
      attempts: cfg.defaultAttempts,
      backoff: { type: "exponential", delay: cfg.defaultBackoffMs },
      removeOnComplete: { count: cfg.removeOnCompleteCount },
      removeOnFail: { count: cfg.removeOnFailCount },
    },
  });
  queues.set(name, queue);
  return queue;
}

export function listQueues(): QueueName[] {
  return [...QUEUE_NAMES];
}

export function getRegisteredQueueCount(): number {
  return queues.size;
}

export interface EnqueueOptions {
  delayMs?: number;
  priority?: number;
  jobId?: string;
  attempts?: number;
}

export async function enqueueJob(
  envelope: JobEnvelope,
  options: EnqueueOptions = {}
): Promise<{ bullJobId: string; jobId: string }> {
  const cfg = getJobsConfig();
  if (!cfg.enabled) throw new JobValidationError("Jobs platform is disabled");

  const queueName = envelope.queueName as QueueName;
  const queue = getQueue(queueName);
  if (!queue) throw new JobValidationError("Jobs Redis unavailable");

  const opts: JobsOptions = {
    jobId: options.jobId ?? envelope.idempotencyKey ?? envelope.jobId,
    priority: options.priority ?? envelope.priority ?? 5,
    delay: options.delayMs,
    attempts: options.attempts ?? cfg.defaultAttempts,
    backoff: { type: "exponential", delay: cfg.defaultBackoffMs },
  };

  const job = await queue.add(envelope.jobName, envelope, opts);
  jobsMetrics.enqueued();
  logger.info("jobs.enqueued", {
    jobId: envelope.jobId,
    jobName: envelope.jobName,
    queueName: envelope.queueName,
    tenantId: envelope.tenantId,
    appKey: envelope.appKey,
    requestId: envelope.requestId,
    correlationId: envelope.correlationId,
    bullJobId: String(job.id),
    status: "pending",
  });
  return { bullJobId: String(job.id), jobId: envelope.jobId };
}

export async function closeAllQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close().catch(() => undefined)));
  queues.clear();
}

export async function getQueueCounts(name: QueueName): Promise<Record<string, number>> {
  const queue = getQueue(name);
  if (!queue) return {};
  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused"
  );
  return counts as Record<string, number>;
}
