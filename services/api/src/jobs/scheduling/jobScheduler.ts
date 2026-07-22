/**
 * Recurring / delayed job scheduling via BullMQ repeatable jobs + Mongo schedule records.
 */

import { getJobsConfig } from "../config/jobConfig";
import { getQueue } from "../queues/queueManager";
import { createJobEnvelope } from "../contracts/jobEnvelope";
import { JOB_NAMES, JOB_QUEUE_MAP } from "../contracts/jobTypes";
import { JobSchedule } from "../persistence/jobModels";
import { withDistributedLock } from "../processing/distributedLock";
import { logger } from "../../observability/logger";

const DEFAULT_RECURRING = [
  {
    name: "system.jobs.cleanup.hourly",
    jobName: JOB_NAMES.SYSTEM_CLEANUP,
    everyMs: 3_600_000,
    payload: {},
  },
  {
    name: "system.health.ping.5m",
    jobName: JOB_NAMES.SYSTEM_HEALTH_PING,
    everyMs: 300_000,
    payload: { source: "scheduler" },
  },
  {
    name: "miraaj.execution.reconcile.1m",
    jobName: JOB_NAMES.MIRAAJ_RECONCILE,
    everyMs: 60_000,
    payload: {},
  },
] as const;

export async function ensureRecurringJobs(): Promise<number> {
  const cfg = getJobsConfig();
  if (!cfg.enabled || !cfg.schedulerEnabled) return 0;

  let count = 0;
  try {
    await withDistributedLock("ensure-recurring", 30_000, async () => {
      for (const def of DEFAULT_RECURRING) {
        const queueName = JOB_QUEUE_MAP[def.jobName];
        const queue = getQueue(queueName);
        if (!queue) continue;

        const envelope = createJobEnvelope({
          jobName: def.jobName,
          queueName,
          tenantId: "system",
          appKey: "admin",
          payload: { ...def.payload },
          actorType: "system",
        });

        await queue.add(def.jobName, envelope, {
          repeat: { every: def.everyMs },
          jobId: `repeat:${def.name}`,
          removeOnComplete: true,
          removeOnFail: false,
        });

        await JobSchedule.updateOne(
          { tenantId: "system", name: def.name },
          {
            $set: {
              jobName: def.jobName,
              queueName,
              everyMs: def.everyMs,
              enabled: true,
              appKey: "admin",
              payload: { ...def.payload },
              lastEnqueuedAt: new Date(),
            },
            $setOnInsert: { tenantId: "system", name: def.name },
          },
          { upsert: true }
        );
        count += 1;
      }
    });
  } catch (err) {
    // Lock contention across replicas is expected
    logger.debug("jobs.scheduler.ensure_skipped", {
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  logger.info("jobs.scheduler.ensured", { status: "ok", count });
  return count;
}

export async function enqueueDelayedJob(
  jobName: (typeof JOB_NAMES)[keyof typeof JOB_NAMES],
  delayMs: number,
  payload: Record<string, unknown>,
  tenantId: string
): Promise<string> {
  const { enqueueNamedJob } = await import("../enqueue");
  const result = await enqueueNamedJob(
    jobName,
    { tenantId, payload, appKey: "main" },
    { delayMs }
  );
  return result.jobId;
}
