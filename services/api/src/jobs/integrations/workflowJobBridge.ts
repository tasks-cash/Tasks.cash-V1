/**
 * Workflow ↔ Jobs bridge helpers.
 */

import { enqueueNamedJob } from "../enqueue";
import { JOB_NAMES } from "../contracts/jobTypes";

export async function enqueueWorkflowResume(input: {
  runId: string;
  tenantId: string;
  appKey?: "main" | "challenge" | "admin";
  correlationId?: string;
}): Promise<{ bullJobId: string; jobId: string }> {
  return enqueueNamedJob(JOB_NAMES.WORKFLOW_RESUME, {
    tenantId: input.tenantId,
    appKey: input.appKey ?? "main",
    payload: { runId: input.runId },
    idempotencyKey: `workflow-resume:${input.runId}:${Date.now()}`,
    correlationId: input.correlationId,
    priority: 4,
  });
}
