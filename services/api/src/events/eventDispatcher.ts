/**
 * Outbox dispatcher: poll → claim → durable handlers → mark delivered / retry / dead-letter.
 * Designed so a future BullMQ worker can claim the same outbox documents.
 */

import os from "os";
import { logger } from "../observability/logger";
import { runWithContext } from "../observability/context";
import { computeRetryDelayMs, getEventBusConfig } from "./eventConfig";
import { dispatchInProcess, getHandlersFor, isEventBusShuttingDown } from "./eventBus";
import { classifyError } from "./eventErrors";
import { eventMetrics } from "./eventMetrics";
import type { EventEnvelopeBase } from "./eventEnvelope";
import { DomainEvent } from "./models/DomainEvent";
import { OutboxEvent, type IOutboxEvent } from "./models/OutboxEvent";
import { runIdempotentHandler } from "./idempotency";

const workerId = `${os.hostname()}:${process.pid}:events`;

let timer: NodeJS.Timeout | null = null;
let running = false;
let cycleInFlight = false;

export function getDispatcherStatus() {
  const m = eventMetrics.snapshot();
  return {
    enabled: getEventBusConfig().dispatcherEnabled && getEventBusConfig().enabled,
    running,
    workerId,
    lastSuccessfulCycle: m.dispatcherLastSuccessAt,
    lastError: m.dispatcherLastError,
    cycles: m.dispatcherCycles,
  };
}

async function releaseStaleLocks(lockTimeoutMs: number): Promise<number> {
  const cutoff = new Date(Date.now() - lockTimeoutMs);
  const res = await OutboxEvent.updateMany(
    { status: "processing", lockedAt: { $lt: cutoff } },
    {
      $set: {
        status: "pending",
        lockedAt: undefined,
        lockedBy: undefined,
        availableAt: new Date(),
      },
    }
  );
  return res.modifiedCount;
}

async function claimBatch(limit: number): Promise<IOutboxEvent[]> {
  const now = new Date();
  const claimed: IOutboxEvent[] = [];
  for (let i = 0; i < limit; i++) {
    const doc = await OutboxEvent.findOneAndUpdate(
      {
        status: "pending",
        availableAt: { $lte: now },
      },
      {
        $set: {
          status: "processing",
          lockedAt: now,
          lockedBy: workerId,
        },
        $inc: { attempts: 1 },
      },
      { sort: { availableAt: 1, createdAt: 1 }, new: true }
    );
    if (!doc) break;
    claimed.push(doc);
  }
  return claimed;
}

/** Process a claimed outbox document (local dispatcher or BullMQ worker). */
export async function processOutboxDocument(doc: IOutboxEvent): Promise<void> {
  const envelope = doc.envelope as unknown as EventEnvelopeBase;
  const cfg = getEventBusConfig();
  const attempt = doc.attempts;

  logger.info("event.outbox.claimed", {
    eventId: doc.eventId,
    eventType: doc.eventType,
    eventVersion: doc.eventVersion,
    tenantId: doc.tenantId,
    appKey: doc.appKey,
    requestId: envelope.requestId,
    correlationId: envelope.correlationId,
    attempt,
    status: "processing",
  });

  await DomainEvent.updateOne(
    { eventId: doc.eventId },
    { $set: { status: "dispatching" }, $inc: { processingAttempts: 1 } }
  );

  const durableHandlers = getHandlersFor(envelope.eventType).filter((h) => h.durable);

  try {
    await runWithContext(
      {
        requestId: envelope.requestId ?? doc.eventId,
        correlationId: envelope.correlationId ?? envelope.requestId ?? doc.eventId,
        route: "event-dispatcher",
        method: "DISPATCH",
      },
      async () => {
        for (const h of durableHandlers) {
          await runIdempotentHandler(
            {
              event: envelope,
              handlerName: h.name,
              handlerVersion: h.version,
              attempt,
            },
            async () => {
              await h.handler(envelope, {
                attempt,
                signal: new AbortController().signal,
              });
            }
          );
        }
        // Also run non-durable observability wildcards if not already
        await dispatchInProcess(envelope, { durableOnly: false, attempt }).catch(() => undefined);
      }
    );

    await OutboxEvent.updateOne(
      { outboxId: doc.outboxId },
      {
        $set: {
          status: "delivered",
          processedAt: new Date(),
          lockedAt: undefined,
          lockedBy: undefined,
          lastError: undefined,
        },
      }
    );
    await DomainEvent.updateOne(
      { eventId: doc.eventId },
      { $set: { status: "processed", processedAt: new Date() } }
    );
    eventMetrics.dispatched();
    logger.info("event.dispatched", {
      eventId: doc.eventId,
      eventType: doc.eventType,
      eventVersion: doc.eventVersion,
      tenantId: doc.tenantId,
      appKey: doc.appKey,
      requestId: envelope.requestId,
      correlationId: envelope.correlationId,
      attempt,
      status: "delivered",
    });
  } catch (err) {
    const failureClass = classifyError(err);
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 2000);

    if (failureClass === "already_processed") {
      await OutboxEvent.updateOne(
        { outboxId: doc.outboxId },
        { $set: { status: "delivered", processedAt: new Date(), lockedAt: undefined, lockedBy: undefined } }
      );
      await DomainEvent.updateOne(
        { eventId: doc.eventId },
        { $set: { status: "processed", processedAt: new Date() } }
      );
      return;
    }

    if (failureClass === "retryable" && attempt < (doc.maximumAttempts || cfg.maxAttempts)) {
      eventMetrics.retry();
      const delay = computeRetryDelayMs(attempt, cfg);
      const availableAt = new Date(Date.now() + delay);
      await OutboxEvent.updateOne(
        { outboxId: doc.outboxId },
        {
          $set: {
            status: "pending",
            availableAt,
            lockedAt: undefined,
            lockedBy: undefined,
            lastError: msg,
          },
        }
      );
      await DomainEvent.updateOne(
        { eventId: doc.eventId },
        { $set: { status: "failed", lastProcessingError: msg } }
      );
      logger.warn("event.handler.retried", {
        eventId: doc.eventId,
        eventType: doc.eventType,
        tenantId: doc.tenantId,
        attempt,
        status: "pending",
        errorCode: "RETRYABLE",
      });
      return;
    }

    eventMetrics.deadLetter();
    await OutboxEvent.updateOne(
      { outboxId: doc.outboxId },
      {
        $set: {
          status: "dead_lettered",
          lockedAt: undefined,
          lockedBy: undefined,
          lastError: msg,
          processedAt: new Date(),
        },
      }
    );
    await DomainEvent.updateOne(
      { eventId: doc.eventId },
      { $set: { status: "dead_lettered", lastProcessingError: msg, processedAt: new Date() } }
    );
    logger.error("event.dead_lettered", {
      eventId: doc.eventId,
      eventType: doc.eventType,
      tenantId: doc.tenantId,
      appKey: doc.appKey,
      requestId: envelope.requestId,
      correlationId: envelope.correlationId,
      attempt,
      status: "dead_lettered",
      errorCode: "DEAD_LETTER",
    });
  }
}

export async function runDispatcherCycle(): Promise<{ claimed: number }> {
  if (isEventBusShuttingDown()) return { claimed: 0 };
  const cfg = getEventBusConfig();
  if (!cfg.enabled || !cfg.dispatcherEnabled) return { claimed: 0 };
  if (cycleInFlight) return { claimed: 0 };
  cycleInFlight = true;
  try {
    await releaseStaleLocks(cfg.lockTimeoutMs);
    const batch = await claimBatch(cfg.dispatchBatchSize);
    const { shouldDispatchOutboxViaBullmq, enqueueClaimedOutbox } = await import(
      "../jobs/integrations/eventBusJobBridge"
    );
    const viaBullmq = shouldDispatchOutboxViaBullmq();
    for (const doc of batch) {
      if (viaBullmq) {
        await enqueueClaimedOutbox(doc);
      } else {
        await processOutboxDocument(doc);
      }
    }

    const [pending, failed, dead, oldest] = await Promise.all([
      OutboxEvent.countDocuments({ status: "pending" }),
      OutboxEvent.countDocuments({ status: "failed" }),
      OutboxEvent.countDocuments({ status: "dead_lettered" }),
      OutboxEvent.findOne({ status: "pending" }).sort({ createdAt: 1 }).select({ createdAt: 1 }).lean<{ createdAt: Date }>(),
    ]);
    const oldestAge = oldest?.createdAt ? Date.now() - new Date(oldest.createdAt).getTime() : undefined;
    eventMetrics.setOutboxStats(pending, failed, dead, oldestAge);
    eventMetrics.dispatcherCycle(true);
    return { claimed: batch.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    eventMetrics.dispatcherCycle(false, msg);
    logger.error("event.dispatcher.cycle_failed", { errorCode: "DISPATCHER_CYCLE", status: "failed" });
    return { claimed: 0 };
  } finally {
    cycleInFlight = false;
  }
}

export function startEventDispatcher(): void {
  const cfg = getEventBusConfig();
  if (!cfg.enabled || !cfg.dispatcherEnabled) {
    logger.info("event.dispatcher.disabled", { status: "disabled" });
    return;
  }
  if (running) return;
  running = true;
  logger.info("event.dispatcher.started", {
    status: "running",
    intervalMs: cfg.dispatchIntervalMs,
    batchSize: cfg.dispatchBatchSize,
  });
  const tick = () => {
    void runDispatcherCycle().finally(() => {
      if (running) {
        timer = setTimeout(tick, getEventBusConfig().dispatchIntervalMs);
        timer.unref?.();
      }
    });
  };
  timer = setTimeout(tick, cfg.dispatchIntervalMs);
  timer.unref?.();
}

export function stopEventDispatcher(): void {
  running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  logger.info("event.dispatcher.stopped", { status: "stopped" });
}

/** Admin / test helpers */
export async function retryOutboxEvent(eventId: string, tenantId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = {
    eventId,
    status: { $in: ["failed", "dead_lettered"] },
  };
  if (tenantId) filter.tenantId = tenantId;
  const res = await OutboxEvent.updateOne(filter, {
    $set: {
      status: "pending",
      availableAt: new Date(),
      lockedAt: undefined,
      lockedBy: undefined,
      lastError: undefined,
    },
  });
  if (res.modifiedCount) {
    await DomainEvent.updateOne(
      { eventId, ...(tenantId ? { tenantId } : {}) },
      { $set: { status: "pending", lastProcessingError: undefined } }
    );
  }
  return res.modifiedCount > 0;
}

export async function cancelOutboxEvent(eventId: string, tenantId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = {
    eventId,
    status: { $in: ["pending", "failed", "dead_lettered"] },
  };
  if (tenantId) filter.tenantId = tenantId;
  const res = await OutboxEvent.updateOne(filter, {
    $set: { status: "failed", processedAt: new Date(), lastError: "cancelled" },
  });
  if (res.modifiedCount) {
    await DomainEvent.updateOne(
      { eventId, ...(tenantId ? { tenantId } : {}) },
      { $set: { status: "cancelled" } }
    );
  }
  return res.modifiedCount > 0;
}
