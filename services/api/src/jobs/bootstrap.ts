/**
 * Jobs platform bootstrap / shutdown.
 */

import { getJobsConfig } from "./config/jobConfig";
import { connectJobsRedis, disconnectJobsRedis, isJobsRedisReady } from "./queues/jobsRedis";
import { closeAllQueues, getRegisteredQueueCount, listQueues } from "./queues/queueManager";
import { startWorkers, stopWorkers, getWorkersStatus } from "./workers/workerManager";
import { registerBuiltinJobHandlers } from "./handlers/builtinHandlers";
import { getRegisteredJobHandlerCount } from "./registry/jobRegistry";
import { ensureRecurringJobs } from "./scheduling/jobScheduler";
import { jobsMetrics } from "./jobsMetrics";
import { logger } from "../observability/logger";

let bootstrapped = false;

export async function bootstrapJobsSystem(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  const cfg = getJobsConfig();
  registerBuiltinJobHandlers();

  if (!cfg.enabled) {
    logger.info("jobs.system.disabled", { status: "disabled" });
    return;
  }

  const redisOk = await connectJobsRedis();
  if (!redisOk) {
    logger.warn("jobs.system.redis_unavailable", { status: "degraded" });
    return;
  }

  // Warm queue instances
  for (const name of listQueues()) {
    const { getQueue } = await import("./queues/queueManager");
    getQueue(name);
  }

  const workers = await startWorkers();
  if (cfg.schedulerEnabled) {
    await ensureRecurringJobs().catch(() => 0);
  }

  logger.info("jobs.system.bootstrapped", {
    status: "ok",
    enabled: cfg.enabled,
    workersEnabled: cfg.workersEnabled,
    outboxDispatchMode: cfg.outboxDispatchMode,
    prefix: cfg.prefix,
    queues: getRegisteredQueueCount(),
    handlers: getRegisteredJobHandlerCount(),
    workers,
  });
}

export async function shutdownJobsSystem(): Promise<void> {
  await stopWorkers();
  await closeAllQueues();
  await disconnectJobsRedis();
  logger.info("jobs.system.shutdown", { status: "stopped" });
}

export function getJobsDiagnostics() {
  const cfg = getJobsConfig();
  const workers = getWorkersStatus();
  const metrics = jobsMetrics.snapshot();
  return {
    enabled: cfg.enabled,
    workersEnabled: cfg.workersEnabled,
    outboxDispatchMode: cfg.outboxDispatchMode,
    redisReady: isJobsRedisReady(),
    prefix: cfg.prefix,
    registeredQueues: listQueues().length,
    warmQueues: getRegisteredQueueCount(),
    registeredHandlers: getRegisteredJobHandlerCount(),
    workers: workers.count,
    workerQueues: workers.queues,
    shuttingDown: workers.shuttingDown,
    metrics,
  };
}
