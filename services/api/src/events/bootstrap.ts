/**
 * Wire event bus + workflow engine at process start.
 */

import { registerHandler } from "./eventBus";
import { bootstrapEventRegistry } from "./eventRegistry";
import { startEventDispatcher, stopEventDispatcher } from "./eventDispatcher";
import { beginEventBusShutdown } from "./eventBus";
import { getEventBusConfig } from "./eventConfig";
import { logger } from "../observability/logger";
import { registerInitialWorkflows } from "../workflows/initialWorkflows";
import { startWorkflowsForEvent } from "../workflows/workflowEngine";
import { EVENT_TYPES } from "./eventTypes";
import type { EventEnvelopeBase } from "./eventEnvelope";

let bootstrapped = false;

const WORKFLOW_TRIGGER_TYPES = new Set<string>([
  EVENT_TYPES.USER_REGISTERED,
  EVENT_TYPES.SUBMISSION_APPROVED,
  EVENT_TYPES.CAMPAIGN_PUBLISHED,
  EVENT_TYPES.REFERRAL_CONVERTED,
  EVENT_TYPES.AI_JOB_REQUESTED,
  EVENT_TYPES.AI_JOB_COMPLETED,
  EVENT_TYPES.AI_JOB_FAILED,
]);

export function bootstrapEventSystem(): void {
  if (bootstrapped) return;
  bootstrapped = true;

  bootstrapEventRegistry();
  registerInitialWorkflows();

  // Observability wildcard (non-durable)
  registerHandler({
    name: "observability.event_mirror",
    version: "1",
    eventType: "*",
    priority: 0,
    mode: "async",
    durable: false,
    handler: async (envelope: EventEnvelopeBase) => {
      logger.debug("event.observed", {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        eventVersion: envelope.eventVersion,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        status: "observed",
      });
    },
  });

  // Durable workflow starter — one handler per trigger type for clear metrics
  for (const eventType of WORKFLOW_TRIGGER_TYPES) {
    registerHandler({
      name: `workflow.trigger.${eventType}`,
      version: "1",
      eventType,
      priority: 100,
      mode: "async",
      durable: true,
      timeoutMs: 180_000,
      handler: async (envelope) => {
        await startWorkflowsForEvent(envelope);
      },
    });
  }

  const cfg = getEventBusConfig();
  if (cfg.enabled && cfg.dispatcherEnabled) {
    startEventDispatcher();
  }

  logger.info("event.system.bootstrapped", {
    status: "ok",
    eventBusEnabled: cfg.enabled,
    dispatcherEnabled: cfg.dispatcherEnabled,
  });
}

export function shutdownEventSystem(): void {
  beginEventBusShutdown();
  stopEventDispatcher();
}
