/**
 * Queue / retry / retention policy helpers.
 */

import { getJobsConfig } from "../config/jobConfig";

export function getDefaultRetryPolicy() {
  const cfg = getJobsConfig();
  return {
    attempts: cfg.defaultAttempts,
    backoff: { type: "exponential" as const, delay: cfg.defaultBackoffMs },
  };
}

export function getRetentionPolicy() {
  const cfg = getJobsConfig();
  return {
    executionRetentionDays: cfg.retentionDays,
    deadLetterRetentionDays: cfg.deadLetterRetentionDays,
    removeOnComplete: cfg.removeOnCompleteCount,
    removeOnFail: cfg.removeOnFailCount,
  };
}

export function priorityForJob(jobName: string): number {
  if (jobName.startsWith("events.")) return 3;
  if (jobName.startsWith("workflows.")) return 4;
  if (jobName.startsWith("rewards.") || jobName.startsWith("notifications.")) return 5;
  if (jobName.startsWith("system.")) return 8;
  return 5;
}
