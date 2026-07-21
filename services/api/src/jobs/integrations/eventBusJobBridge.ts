/**
 * Bridge: when JOBS_OUTBOX_DISPATCH_MODE=bullmq, claim outbox then enqueue to BullMQ.
 * Outbox remains the durable source of truth; local mode is unchanged.
 */

import { getJobsConfig } from "../config/jobConfig";
import { enqueueNamedJob } from "../enqueue";
import { JOB_NAMES } from "../contracts/jobTypes";
import type { IOutboxEvent } from "../../events/models/OutboxEvent";
import { logger } from "../../observability/logger";

export function shouldDispatchOutboxViaBullmq(): boolean {
  const jobs = getJobsConfig();
  return jobs.enabled && jobs.outboxDispatchMode === "bullmq";
}

/**
 * After atomic claim, enqueue OUTBOX_DISPATCH instead of in-process handlers.
 * On enqueue failure, release the claim back to pending.
 */
export async function enqueueClaimedOutbox(doc: IOutboxEvent): Promise<void> {
  const envelope = doc.envelope as {
    requestId?: string;
    correlationId?: string;
    tenantId?: string;
    appKey?: string;
  };

  try {
    await enqueueNamedJob(
      JOB_NAMES.OUTBOX_DISPATCH,
      {
        tenantId: doc.tenantId,
        appKey: (doc.appKey as "main" | "challenge" | "admin") || "main",
        payload: {
          outboxId: doc.outboxId,
          eventId: doc.eventId,
          eventType: doc.eventType,
        },
        idempotencyKey: `outbox:${doc.outboxId}:attempt:${doc.attempts}`,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        priority: 3,
      },
      { jobId: `outbox-${doc.outboxId}-${doc.attempts}` }
    );
    logger.info("jobs.outbox.enqueued", {
      outboxId: doc.outboxId,
      eventId: doc.eventId,
      eventType: doc.eventType,
      tenantId: doc.tenantId,
      attempt: doc.attempts,
      status: "enqueued",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const { OutboxEvent } = await import("../../events/models/OutboxEvent");
    await OutboxEvent.updateOne(
      { outboxId: doc.outboxId, status: "processing" },
      {
        $set: {
          status: "pending",
          availableAt: new Date(Date.now() + 5_000),
          lockedAt: undefined,
          lockedBy: undefined,
          lastError: `bullmq_enqueue_failed: ${msg.slice(0, 500)}`,
        },
        $inc: { attempts: -1 },
      }
    );
    logger.error("jobs.outbox.enqueue_failed", {
      outboxId: doc.outboxId,
      eventId: doc.eventId,
      status: "pending",
      errorCode: "ENQUEUE_FAILED",
    });
    throw err;
  }
}
