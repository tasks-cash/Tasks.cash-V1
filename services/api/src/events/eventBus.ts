/**
 * Strongly typed in-process event bus (not a raw EventEmitter).
 */

import { logger } from "../observability/logger";
import { EventEnvelopeBase } from "./eventEnvelope";
import {
  EventHandlerPermanentError,
  EventHandlerRetryableError,
  EventHandlerTimeoutError,
  EventRegistrationError,
  classifyError,
} from "./eventErrors";
import { getEventBusConfig } from "./eventConfig";
import { eventMetrics } from "./eventMetrics";
import { isEventTypeRegistered } from "./eventRegistry";

export type EventHandlerMode = "sync" | "async";

export interface EventHandlerContext {
  attempt: number;
  signal: AbortSignal;
}

export type EventHandlerFn = (
  envelope: EventEnvelopeBase,
  ctx: EventHandlerContext
) => void | Promise<void>;

export interface RegisteredHandler {
  name: string;
  version: string;
  eventType: string | "*";
  priority: number;
  mode: EventHandlerMode;
  timeoutMs?: number;
  maxAttempts?: number;
  durable: boolean;
  handler: EventHandlerFn;
}

interface HandlerResult {
  handlerName: string;
  status: "succeeded" | "failed" | "skipped";
  durationMs: number;
  errorCode?: string;
  errorMessage?: string;
  failureClass?: string;
}

const handlersByType = new Map<string, RegisteredHandler[]>();
const handlerNames = new Set<string>();
let shuttingDown = false;

function sortHandlers(list: RegisteredHandler[]): RegisteredHandler[] {
  return [...list].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority; // higher first
    return a.name.localeCompare(b.name);
  });
}

export function registerHandler(reg: RegisteredHandler): void {
  if (shuttingDown) {
    throw new EventRegistrationError("Cannot register handlers during shutdown");
  }
  const key = `${reg.name}@${reg.version}:${reg.eventType}`;
  if (handlerNames.has(key)) {
    throw new EventRegistrationError(`Duplicate handler registration: ${key}`);
  }
  if (reg.eventType !== "*" && !isEventTypeRegistered(reg.eventType)) {
    throw new EventRegistrationError(`Cannot register handler for unknown event: ${reg.eventType}`);
  }
  handlerNames.add(key);
  const list = handlersByType.get(reg.eventType) ?? [];
  list.push(reg);
  handlersByType.set(reg.eventType, sortHandlers(list));
}

export function getHandlersFor(eventType: string): RegisteredHandler[] {
  const specific = handlersByType.get(eventType) ?? [];
  const wild = handlersByType.get("*") ?? [];
  return sortHandlers([...specific, ...wild]);
}

export function getRegisteredHandlerCount(): number {
  return handlerNames.size;
}

export function listRegisteredHandlers(): RegisteredHandler[] {
  const all: RegisteredHandler[] = [];
  for (const list of handlersByType.values()) all.push(...list);
  return all;
}

async function runWithTimeout(
  fn: () => Promise<void>,
  timeoutMs: number,
  handlerName: string
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const controller = new AbortController();
  try {
    await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new EventHandlerTimeoutError(handlerName, timeoutMs));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function dispatchInProcess(
  envelope: EventEnvelopeBase,
  options?: { durableOnly?: boolean; attempt?: number }
): Promise<HandlerResult[]> {
  if (shuttingDown) {
    throw new EventHandlerPermanentError("Event bus is shutting down");
  }
  const cfg = getEventBusConfig();
  const attempt = options?.attempt ?? 1;
  const handlers = getHandlersFor(envelope.eventType).filter((h) =>
    options?.durableOnly ? h.durable : !h.durable || h.mode === "sync"
  );

  const results: HandlerResult[] = [];

  for (const h of handlers) {
    // Isolation: one handler failure does not skip remaining unless fatal for durable path
    const started = Date.now();
    const timeoutMs = h.timeoutMs ?? cfg.handlerTimeoutMs;
    try {
      const controller = new AbortController();
      await runWithTimeout(
        async () => {
          await h.handler(envelope, { attempt, signal: controller.signal });
        },
        timeoutMs,
        h.name
      );
      const durationMs = Date.now() - started;
      eventMetrics.handlerOk(durationMs);
      results.push({ handlerName: h.name, status: "succeeded", durationMs });
      logger.info("event.handler.succeeded", {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        eventVersion: envelope.eventVersion,
        handlerName: h.name,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        causationId: envelope.causationId,
        attempt,
        durationMs,
        status: "succeeded",
      });
    } catch (err) {
      const durationMs = Date.now() - started;
      const failureClass = classifyError(err);
      const errorCode = err instanceof Error && "code" in err ? String((err as { code: string }).code) : "HANDLER_ERROR";
      const errorMessage = err instanceof Error ? err.message : String(err);
      eventMetrics.handlerFail(durationMs);
      results.push({
        handlerName: h.name,
        status: "failed",
        durationMs,
        errorCode,
        errorMessage,
        failureClass,
      });
      logger.error("event.handler.failed", {
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        eventVersion: envelope.eventVersion,
        handlerName: h.name,
        tenantId: envelope.tenantId,
        appKey: envelope.appKey,
        requestId: envelope.requestId,
        correlationId: envelope.correlationId,
        attempt,
        durationMs,
        status: "failed",
        errorCode,
        // never log full payload
      });
      if (failureClass === "retryable") {
        throw new EventHandlerRetryableError(errorMessage);
      }
      if (options?.durableOnly) {
        throw err instanceof Error ? err : new EventHandlerPermanentError(errorMessage);
      }
    }
  }

  return results;
}

/** Publish to sync / non-durable handlers immediately (after validation). */
export async function publishInProcess(envelope: EventEnvelopeBase): Promise<HandlerResult[]> {
  eventMetrics.dispatched();
  logger.info("event.dispatched.in_process", {
    eventId: envelope.eventId,
    eventType: envelope.eventType,
    eventVersion: envelope.eventVersion,
    tenantId: envelope.tenantId,
    appKey: envelope.appKey,
    requestId: envelope.requestId,
    correlationId: envelope.correlationId,
    status: "dispatching",
  });
  return dispatchInProcess(envelope, { durableOnly: false });
}

export function beginEventBusShutdown(): void {
  shuttingDown = true;
}

export function resetEventBusForTests(): void {
  handlersByType.clear();
  handlerNames.clear();
  shuttingDown = false;
}

export function isEventBusShuttingDown(): boolean {
  return shuttingDown;
}
