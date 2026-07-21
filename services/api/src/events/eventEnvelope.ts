/**
 * Immutable domain event envelope + sanitization helpers.
 */

import { z } from "zod";
import { generatePublicId } from "../domain/shared/publicId";
import { isSafeMetadata, MAX_METADATA_BYTES } from "../domain/shared/baseSchema";
import { getContext } from "../observability/context";
import { EventValidationError } from "./eventErrors";
import { getEventBusConfig } from "./eventConfig";

export const ACTOR_TYPES = ["user", "admin", "system", "service", "anonymous"] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const EVENT_SOURCES = [
  "api",
  "admin",
  "worker",
  "workflow",
  "system",
  "scheduler",
] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];

/** Optional product analytics / attribution metadata (never secrets). */
export const eventMetadataSchema = z
  .object({
    ip: z.string().max(64).optional(),
    userAgent: z.string().max(512).optional(),
    locale: z.string().max(32).optional(),
    timezone: z.string().max(64).optional(),
    sessionId: z.string().max(128).optional(),
    anonymousId: z.string().max(128).optional(),
    deviceId: z.string().max(128).optional(),
    userId: z.string().max(128).optional(),
    pageId: z.string().max(128).optional(),
    route: z.string().max(512).optional(),
    referrer: z.string().max(1024).optional(),
    source: z.string().max(128).optional(),
    medium: z.string().max(128).optional(),
    campaign: z.string().max(256).optional(),
    content: z.string().max(256).optional(),
    term: z.string().max(256).optional(),
    clickId: z.string().max(256).optional(),
    adPlatform: z.string().max(64).optional(),
    landingPage: z.string().max(1024).optional(),
    consentState: z.enum(["unknown", "granted", "denied", "partial"]).optional(),
    experimentId: z.string().max(128).optional(),
    variantId: z.string().max(128).optional(),
    workflowId: z.string().max(64).optional(),
    workflowRunId: z.string().max(64).optional(),
    utm_source: z.string().max(128).optional(),
    utm_medium: z.string().max(128).optional(),
    utm_campaign: z.string().max(256).optional(),
    utm_content: z.string().max(256).optional(),
    utm_term: z.string().max(256).optional(),
  })
  .strict()
  .optional();

export type EventMetadata = z.infer<typeof eventMetadataSchema>;

export interface EventEnvelopeBase {
  readonly eventId: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly occurredAt: string;
  readonly publishedAt: string;
  readonly tenantId: string;
  readonly appKey: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly actorType: ActorType;
  readonly actorId: string;
  readonly source: EventSource;
  readonly environment: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly traceId?: string;
  readonly idempotencyKey?: string;
  readonly payload: Record<string, unknown>;
  readonly metadata?: EventMetadata;
}

const SECRET_KEY =
  /^(password|passwd|secret|token|accessToken|refreshToken|apiKey|authorization|cookie|creditCard|cvv|ssn)$/i;

export function sanitizeEventValue(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 4_096) return `${value.slice(0, 4_096)}…[truncated]`;
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 100).map((v) => sanitizeEventValue(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith("$") || k.includes(".") || k === "__proto__" || k === "constructor") continue;
      if (SECRET_KEY.test(k)) {
        out[k] = "[REDACTED]";
        continue;
      }
      out[k] = sanitizeEventValue(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

export function assertPayloadSize(payload: unknown): void {
  const cfg = getEventBusConfig();
  let json: string;
  try {
    json = JSON.stringify(payload);
  } catch {
    throw new EventValidationError("Event payload is not JSON-serializable");
  }
  if (Buffer.byteLength(json, "utf8") > cfg.maxPayloadBytes) {
    throw new EventValidationError(
      `Event payload exceeds ${cfg.maxPayloadBytes} bytes`,
      [`size=${Buffer.byteLength(json, "utf8")}`]
    );
  }
  if (!isSafeMetadata(payload as Record<string, unknown>) && payload && typeof payload === "object") {
    // isSafeMetadata rejects arrays at top level — payloads are objects; still check keys
    const stack: unknown[] = [payload];
    while (stack.length) {
      const cur = stack.pop();
      if (cur && typeof cur === "object" && !Array.isArray(cur)) {
        for (const key of Object.keys(cur as Record<string, unknown>)) {
          if (key.startsWith("$") || key.includes(".") || key === "__proto__") {
            throw new EventValidationError("Unsafe keys in event payload", [key]);
          }
          stack.push((cur as Record<string, unknown>)[key]);
        }
      } else if (Array.isArray(cur)) {
        stack.push(...cur);
      }
    }
  }
  if (json.includes('"__proto__"') || json.includes('"constructor"')) {
    throw new EventValidationError("Prototype pollution keys rejected");
  }
}

export interface CreateEnvelopeInput {
  eventType: string;
  eventVersion: number;
  tenantId: string;
  appKey?: string;
  aggregateType: string;
  aggregateId: string;
  actorType?: ActorType;
  actorId?: string;
  source?: EventSource;
  payload: Record<string, unknown>;
  metadata?: EventMetadata;
  occurredAt?: Date;
  causationId?: string;
  idempotencyKey?: string;
  requestId?: string;
  correlationId?: string;
  traceId?: string;
}

export function createEventEnvelope(input: CreateEnvelopeInput): EventEnvelopeBase {
  assertPayloadSize(input.payload);
  if (input.metadata !== undefined) {
    const metaCheck = eventMetadataSchema.safeParse(input.metadata);
    if (!metaCheck.success) {
      throw new EventValidationError("Invalid event metadata", metaCheck.error.issues.map((i) => i.message));
    }
    const metaJson = JSON.stringify(input.metadata);
    if (Buffer.byteLength(metaJson, "utf8") > MAX_METADATA_BYTES) {
      throw new EventValidationError("Event metadata too large");
    }
  }

  const ctx = getContext();
  const now = new Date();
  const occurredAt = (input.occurredAt ?? now).toISOString();
  const payload = sanitizeEventValue(input.payload) as Record<string, unknown>;
  const metadata = input.metadata
    ? (sanitizeEventValue(input.metadata) as EventMetadata)
    : undefined;

  const envelope: EventEnvelopeBase = Object.freeze({
    eventId: generatePublicId("domainEvent"),
    eventType: input.eventType,
    eventVersion: input.eventVersion,
    occurredAt,
    publishedAt: now.toISOString(),
    tenantId: input.tenantId,
    appKey: input.appKey ?? "main",
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    actorType: input.actorType ?? "system",
    actorId: input.actorId ?? "system",
    source: input.source ?? "api",
    environment: process.env.NODE_ENV ?? "development",
    requestId: input.requestId ?? ctx?.requestId,
    correlationId: input.correlationId ?? ctx?.correlationId ?? ctx?.requestId,
    causationId: input.causationId,
    traceId: input.traceId ?? ctx?.requestId,
    idempotencyKey: input.idempotencyKey,
    payload,
    metadata,
  });

  return envelope;
}
