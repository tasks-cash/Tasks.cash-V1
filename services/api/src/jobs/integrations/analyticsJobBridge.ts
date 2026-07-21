/**
 * Analytics ↔ Jobs bridge helpers.
 */

import { enqueueNamedJob } from "../enqueue";
import { JOB_NAMES } from "../contracts/jobTypes";

export async function enqueueAnalyticsCleanup(tenantId = "system"): Promise<{
  bullJobId: string;
  jobId: string;
}> {
  return enqueueNamedJob(JOB_NAMES.ANALYTICS_CLEANUP, {
    tenantId,
    appKey: "admin",
    payload: { reason: "scheduled" },
    idempotencyKey: `analytics-cleanup:${new Date().toISOString().slice(0, 13)}`,
    priority: 7,
  });
}

export async function enqueueAnalyticsAggregate(tenantId = "system"): Promise<{
  bullJobId: string;
  jobId: string;
}> {
  return enqueueNamedJob(JOB_NAMES.ANALYTICS_AGGREGATE, {
    tenantId,
    appKey: "admin",
    payload: { reason: "scheduled" },
    priority: 8,
  });
}
