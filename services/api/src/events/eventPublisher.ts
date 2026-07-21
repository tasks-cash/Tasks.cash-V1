/**
 * Event publisher: validate → envelope → optional outbox (same Mongo session) → in-process sync.
 */

import type { ClientSession } from "mongoose";
import { generatePublicId } from "../domain/shared/publicId";
import { logger } from "../observability/logger";
import { getEventBusConfig } from "./eventConfig";
import {
  createEventEnvelope,
  type CreateEnvelopeInput,
  type EventEnvelopeBase,
} from "./eventEnvelope";
import { EventPersistenceError, EventValidationError } from "./eventErrors";
import { eventMetrics } from "./eventMetrics";
import { publishInProcess } from "./eventBus";
import {
  bootstrapEventRegistry,
  getEventTypeDefinition,
  validateEventPayload,
} from "./eventRegistry";
import { DomainEvent } from "./models/DomainEvent";
import { OutboxEvent } from "./models/OutboxEvent";

export interface PublishDurableOptions {
  session?: ClientSession;
  /** Skip immediate in-process non-durable handlers (default: run them after persist). */
  skipInProcess?: boolean;
  financial?: boolean;
}

export interface PublishResult {
  envelope: EventEnvelopeBase;
  persisted: boolean;
  outboxId?: string;
}

bootstrapEventRegistry();

/**
 * Publish a durable domain event via transactional outbox.
 * When `session` is provided, DomainEvent + OutboxEvent insert in the same transaction.
 */
export async function publishDurableEvent(
  input: Omit<CreateEnvelopeInput, "eventVersion"> & { eventVersion?: number },
  options: PublishDurableOptions = {}
): Promise<PublishResult> {
  const cfg = getEventBusConfig();
  if (!cfg.enabled) {
    throw new EventPersistenceError("Event bus is disabled", "permanent");
  }

  const defn = getEventTypeDefinition(input.eventType);
  if (!defn) {
    throw new EventValidationError(`Unknown event type: ${input.eventType}`);
  }

  const payload = validateEventPayload(input.eventType, input.payload);
  const envelope = createEventEnvelope({
    ...input,
    eventVersion: input.eventVersion ?? defn.eventVersion,
    payload,
    aggregateType: input.aggregateType || defn.aggregateType,
  });

  const session = options.session;
  try {
    const [domainDoc] = await DomainEvent.create(
      [
        {
          eventId: envelope.eventId,
          eventType: envelope.eventType,
          eventVersion: envelope.eventVersion,
          tenantId: envelope.tenantId,
          appKey: envelope.appKey,
          aggregateType: envelope.aggregateType,
          aggregateId: envelope.aggregateId,
          actorType: envelope.actorType,
          actorId: envelope.actorId,
          occurredAt: new Date(envelope.occurredAt),
          publishedAt: new Date(envelope.publishedAt),
          requestId: envelope.requestId,
          correlationId: envelope.correlationId,
          causationId: envelope.causationId,
          idempotencyKey: envelope.idempotencyKey,
          source: envelope.source,
          environment: envelope.environment,
          payload: envelope.payload,
          metadata: envelope.metadata,
          status: "pending",
          financial: options.financial === true,
        },
      ],
      session ? { session } : undefined
    );

    const outboxId = generatePublicId("outboxEvent");
    await OutboxEvent.create(
      [
        {
          outboxId,
          eventId: envelope.eventId,
          tenantId: envelope.tenantId,
          appKey: envelope.appKey,
          eventType: envelope.eventType,
          eventVersion: envelope.eventVersion,
          envelope: { ...envelope },
          status: "pending",
          availableAt: new Date(),
          maximumAttempts: cfg.maxAttempts,
          aggregateType: envelope.aggregateType,
          aggregateId: envelope.aggregateId,
        },
      ],
      session ? { session } : undefined
    );

    eventMetrics.published();
    logger.info("event.persisted", {
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      eventVersion: envelope.eventVersion,
      tenantId: envelope.tenantId,
      appKey: envelope.appKey,
      requestId: envelope.requestId,
      correlationId: envelope.correlationId,
      causationId: envelope.causationId,
      status: "pending",
      outboxId,
    });

    if (!options.skipInProcess && !session) {
      // Only run sync handlers immediately when not inside a transaction
      // (transaction may still roll back). After commit, dispatcher handles durable.
      await publishInProcess(envelope).catch((err) => {
        logger.warn("event.in_process_handler_error", {
          eventId: envelope.eventId,
          errorCode: err instanceof Error ? err.name : "Error",
        });
      });
    }

    return { envelope, persisted: true, outboxId: domainDoc ? outboxId : outboxId };
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
      // Idempotent republish — find existing
      if (input.idempotencyKey) {
        const existing = await DomainEvent.findOne({
          tenantId: input.tenantId,
          idempotencyKey: input.idempotencyKey,
        }).lean();
        if (existing) {
          logger.info("event.idempotent_skip_publish", {
            eventId: existing.eventId,
            eventType: existing.eventType,
            tenantId: existing.tenantId,
            status: "already_processed",
          });
          return {
            envelope: createEventEnvelope({
              ...input,
              eventVersion: existing.eventVersion,
              payload: existing.payload as Record<string, unknown>,
            }),
            persisted: false,
          };
        }
      }
    }
    throw new EventPersistenceError(
      err instanceof Error ? err.message : "Failed to persist event",
      "retryable"
    );
  }
}

/**
 * Fire-and-forget helper for services: publish after domain success.
 * Uses outbox without requiring caller to manage a session (best-effort same-process durability).
 * Prefer `publishDurableEvent(..., { session })` inside withTransaction for financial ops.
 */
export async function emitDomainEvent(
  input: Omit<CreateEnvelopeInput, "eventVersion"> & { eventVersion?: number },
  options: PublishDurableOptions = {}
): Promise<PublishResult | null> {
  const cfg = getEventBusConfig();
  if (!cfg.enabled) return null;
  try {
    return await publishDurableEvent(input, options);
  } catch (err) {
    logger.error("event.emit_failed", {
      eventType: input.eventType,
      tenantId: input.tenantId,
      errorCode: err instanceof Error && "code" in err ? String((err as { code: string }).code) : "EMIT_FAILED",
    });
    throw err;
  }
}
