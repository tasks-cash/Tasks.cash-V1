/**
 * Idempotent durable consumer guard using EventHandlerExecution uniqueness.
 */

import { generatePublicId } from "../domain/shared/publicId";
import { logger } from "../observability/logger";
import { EventIdempotencyError } from "./eventErrors";
import { eventMetrics } from "./eventMetrics";
import { EventHandlerExecution } from "./models/EventHandlerExecution";
import type { EventEnvelopeBase } from "./eventEnvelope";

export interface IdempotentRunOptions {
  event: EventEnvelopeBase;
  handlerName: string;
  handlerVersion: string;
  attempt?: number;
}

export type IdempotentOutcome<T> =
  | { status: "executed"; result: T; executionId: string }
  | { status: "skipped"; executionId: string };

/**
 * Ensure a durable handler runs at most once successfully per event.
 * Concurrent duplicates: unique index wins; loser skips or retries based on existing status.
 */
export async function runIdempotentHandler<T>(
  opts: IdempotentRunOptions,
  fn: () => Promise<T>
): Promise<IdempotentOutcome<T>> {
  const { event, handlerName, handlerVersion } = opts;
  const attempt = opts.attempt ?? 1;

  const existing = await EventHandlerExecution.findOne({
    eventId: event.eventId,
    handlerName,
    handlerVersion,
  }).lean();

  if (existing?.status === "succeeded" || existing?.status === "skipped") {
    eventMetrics.handlerSkip();
    logger.info("event.handler.skipped_duplicate", {
      eventId: event.eventId,
      eventType: event.eventType,
      handlerName,
      tenantId: event.tenantId,
      appKey: event.appKey,
      requestId: event.requestId,
      correlationId: event.correlationId,
      attempt,
      status: "skipped",
    });
    return { status: "skipped", executionId: existing.executionId };
  }

  const executionId = existing?.executionId ?? generatePublicId("handlerExecution");
  const startedAt = new Date();

  try {
    if (!existing) {
      await EventHandlerExecution.create({
        executionId,
        eventId: event.eventId,
        handlerName,
        handlerVersion,
        tenantId: event.tenantId,
        appKey: event.appKey,
        status: "processing",
        attempt,
        startedAt,
      });
    } else {
      await EventHandlerExecution.updateOne(
        { executionId, status: { $in: ["pending", "failed", "processing"] } },
        { $set: { status: "processing", attempt, startedAt } }
      );
    }
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      const raced = await EventHandlerExecution.findOne({
        eventId: event.eventId,
        handlerName,
        handlerVersion,
      }).lean();
      if (raced?.status === "succeeded" || raced?.status === "processing") {
        eventMetrics.handlerSkip();
        logger.info("event.handler.skipped_duplicate", {
          eventId: event.eventId,
          handlerName,
          tenantId: event.tenantId,
          status: "skipped",
        });
        return { status: "skipped", executionId: raced.executionId };
      }
      throw new EventIdempotencyError();
    }
    throw err;
  }

  try {
    const result = await fn();
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    await EventHandlerExecution.updateOne(
      { executionId },
      {
        $set: {
          status: "succeeded",
          completedAt,
          durationMs,
          errorCode: undefined,
          errorMessage: undefined,
        },
      }
    );
    return { status: "executed", result, executionId };
  } catch (err) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const errorMessage = err instanceof Error ? err.message.slice(0, 2000) : String(err);
    const errorCode =
      err instanceof Error && "code" in err ? String((err as { code: string }).code) : "HANDLER_ERROR";
    await EventHandlerExecution.updateOne(
      { executionId },
      {
        $set: {
          status: "failed",
          completedAt,
          durationMs,
          errorCode,
          errorMessage,
        },
      }
    );
    throw err;
  }
}
