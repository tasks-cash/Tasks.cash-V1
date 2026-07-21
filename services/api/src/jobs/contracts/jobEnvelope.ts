/**
 * Immutable job envelope — correlation + tenant context for every job.
 */

import { z } from "zod";
import { generatePublicId } from "../../domain/shared/publicId";
import { getContext } from "../../observability/context";
import { JOB_NAME_SET, type JobName } from "./jobTypes";
import { JobValidationError } from "./jobErrors";
import { QUEUE_NAME_SET, type QueueName } from "../queues/queueNames";

export const jobEnvelopeSchema = z.object({
  jobId: z.string().min(8).max(64),
  jobName: z.string().min(3).max(128),
  jobVersion: z.number().int().min(1).default(1),
  queueName: z.string().min(2).max(64),
  tenantId: z.string().min(1).max(64),
  appKey: z.enum(["main", "challenge", "admin"]).default("main"),
  actorType: z.enum(["user", "admin", "system", "service", "anonymous"]).default("system"),
  actorId: z.string().max(128).default("system"),
  requestId: z.string().max(128).optional(),
  correlationId: z.string().max(128).optional(),
  causationId: z.string().max(128).optional(),
  idempotencyKey: z.string().max(256).optional(),
  priority: z.number().int().min(1).max(10).default(5),
  scheduledFor: z.string().datetime().optional(),
  payload: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
});

export type JobEnvelope = z.infer<typeof jobEnvelopeSchema>;

const SECRET_KEY =
  /^(password|passwd|secret|token|accessToken|refreshToken|apiKey|authorization|cookie)$/i;

export function sanitizeJobPayload(value: unknown, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > 4_096 ? `${value.slice(0, 4_096)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 100).map((v) => sanitizeJobPayload(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k.startsWith("$") || k.includes(".") || k === "__proto__") continue;
      if (SECRET_KEY.test(k)) {
        out[k] = "[REDACTED]";
        continue;
      }
      out[k] = sanitizeJobPayload(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

export interface CreateJobEnvelopeInput {
  jobName: JobName | string;
  queueName: QueueName | string;
  tenantId: string;
  appKey?: "main" | "challenge" | "admin";
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  actorType?: JobEnvelope["actorType"];
  actorId?: string;
  idempotencyKey?: string;
  /** When set (idempotent reserve), reuse this stable identity instead of minting a new one. */
  jobId?: string;
  priority?: number;
  causationId?: string;
  requestId?: string;
  correlationId?: string;
  jobVersion?: number;
}

export function createJobEnvelope(input: CreateJobEnvelopeInput): JobEnvelope {
  if (!JOB_NAME_SET.has(input.jobName) && !input.jobName.startsWith("system.")) {
    // Allow only registered job names
    if (!JOB_NAME_SET.has(input.jobName)) {
      throw new JobValidationError(`Unknown job name: ${input.jobName}`);
    }
  }
  if (!QUEUE_NAME_SET.has(input.queueName)) {
    throw new JobValidationError(`Unknown queue name: ${input.queueName}`);
  }

  const ctx = getContext();
  const now = new Date().toISOString();
  const envelope: JobEnvelope = Object.freeze({
    jobId: input.jobId ?? generatePublicId("jobExecution"),
    jobName: input.jobName,
    jobVersion: input.jobVersion ?? 1,
    queueName: input.queueName,
    tenantId: input.tenantId,
    appKey: input.appKey ?? "main",
    actorType: input.actorType ?? "system",
    actorId: input.actorId ?? "system",
    requestId: input.requestId ?? ctx?.requestId,
    correlationId: input.correlationId ?? ctx?.correlationId ?? ctx?.requestId,
    causationId: input.causationId,
    idempotencyKey: input.idempotencyKey,
    priority: input.priority ?? 5,
    payload: sanitizeJobPayload(input.payload) as Record<string, unknown>,
    metadata: input.metadata
      ? (sanitizeJobPayload(input.metadata) as Record<string, unknown>)
      : undefined,
    createdAt: now,
  });

  const parsed = jobEnvelopeSchema.safeParse(envelope);
  if (!parsed.success) {
    throw new JobValidationError(
      "Invalid job envelope",
      parsed.error.issues.map((i) => i.message)
    );
  }
  return envelope;
}
