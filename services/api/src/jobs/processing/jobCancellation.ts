/**
 * Cancel a job by jobId — checked by workers before/during processing.
 */

import { JobCancellation } from "../persistence/jobModels";
import { getQueue } from "../queues/queueManager";
import type { QueueName } from "../queues/queueNames";
import { jobsMetrics } from "../jobsMetrics";

export async function cancelJob(input: {
  jobId: string;
  tenantId: string;
  reason?: string;
  cancelledBy?: string;
  queueName?: QueueName;
  bullJobId?: string;
}): Promise<boolean> {
  await JobCancellation.updateOne(
    { jobId: input.jobId },
    {
      $setOnInsert: {
        jobId: input.jobId,
        tenantId: input.tenantId,
        reason: input.reason,
        cancelledBy: input.cancelledBy,
        cancelledAt: new Date(),
      },
    },
    { upsert: true }
  );

  if (input.queueName && input.bullJobId) {
    const queue = getQueue(input.queueName);
    if (queue) {
      const job = await queue.getJob(input.bullJobId);
      if (job) {
        try {
          await job.remove();
        } catch {
          // may already be active — cancellation record still blocks processing
        }
      }
    }
  }

  jobsMetrics.cancelled();
  return true;
}
