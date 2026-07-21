/**
 * Thin helper for domain services to emit durable events without circular imports.
 */

import { emitDomainEvent } from "../../events/eventPublisher";
import type { ActorContext } from "./serviceTypes";
import type { EventMetadata, ActorType, EventSource } from "../../events/eventEnvelope";

export async function publishDomainServiceEvent(input: {
  ctx: ActorContext;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  metadata?: EventMetadata;
  actorType?: ActorType;
  source?: EventSource;
  financial?: boolean;
  appKey?: string;
}): Promise<void> {
  await emitDomainEvent(
    {
      eventType: input.eventType,
      tenantId: input.ctx.tenantId,
      appKey: input.appKey ?? "main",
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      actorType: input.actorType ?? "admin",
      actorId: input.ctx.actorId,
      source: input.source ?? "admin",
      payload: input.payload,
      metadata: input.metadata,
      idempotencyKey: input.idempotencyKey,
    },
    { financial: input.financial }
  );
}
