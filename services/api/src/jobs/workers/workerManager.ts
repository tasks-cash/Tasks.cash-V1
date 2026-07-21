/**
 * Worker factory / manager — one Worker per queue with shared processor.
 */

import { Worker, type Job } from "bullmq";
import { getJobsConfig } from "../config/jobConfig";
import { getJobsRedisConnection } from "../queues/jobsRedis";
import { QUEUE_NAMES, type QueueName } from "../queues/queueNames";
import { processBullJob } from "../processing/jobProcessor";
import type { JobEnvelope } from "../contracts/jobEnvelope";
import { jobsMetrics } from "../jobsMetrics";
import { logger } from "../../observability/logger";

const workers = new Map<string, Worker>();
let shuttingDown = false;

export function isJobsShuttingDown(): boolean {
  return shuttingDown;
}

export function beginJobsShutdown(): void {
  shuttingDown = true;
}

export async function startWorkers(queues: QueueName[] = [...QUEUE_NAMES]): Promise<number> {
  const cfg = getJobsConfig();
  if (!cfg.enabled || !cfg.workersEnabled) {
    logger.info("jobs.workers.disabled", { status: "disabled" });
    return 0;
  }
  const connection = getJobsRedisConnection();
  if (!connection) {
    logger.warn("jobs.workers.no_redis", { status: "degraded" });
    return 0;
  }

  let started = 0;
  for (const name of queues) {
    if (workers.has(name)) continue;
    const worker = new Worker<JobEnvelope>(
      name,
      async (job: Job<JobEnvelope>) => {
        if (shuttingDown) throw new Error("Jobs platform shutting down");
        return processBullJob(job);
      },
      {
        connection,
        prefix: cfg.prefix,
        concurrency: cfg.concurrency,
        lockDuration: cfg.lockDurationMs,
        stalledInterval: cfg.stalledIntervalMs,
      }
    );
    worker.on("failed", (job, err) => {
      logger.warn("jobs.worker.failed", {
        jobId: job?.data?.jobId,
        jobName: job?.name,
        queueName: name,
        error: err.message.slice(0, 500),
        status: "failed",
      });
    });
    worker.on("error", (err) => {
      logger.warn("jobs.worker.error", {
        queueName: name,
        error: err.message.slice(0, 500),
        status: "error",
      });
    });
    workers.set(name, worker);
    jobsMetrics.workerStarted();
    started += 1;
  }

  logger.info("jobs.workers.started", {
    status: "running",
    count: started,
    concurrency: cfg.concurrency,
  });
  return started;
}

export function getWorkerCount(): number {
  return workers.size;
}

export function listActiveWorkerQueues(): string[] {
  return [...workers.keys()];
}

export async function stopWorkers(): Promise<void> {
  beginJobsShutdown();
  await Promise.all([...workers.values()].map((w) => w.close().catch(() => undefined)));
  workers.clear();
  logger.info("jobs.workers.stopped", { status: "stopped" });
}

/** Test helper — allow starting workers again after stopWorkers. */
export function resetWorkersForTests(): void {
  shuttingDown = false;
  workers.clear();
}

export function getWorkersStatus() {
  return {
    shuttingDown,
    count: workers.size,
    queues: listActiveWorkerQueues(),
  };
}
