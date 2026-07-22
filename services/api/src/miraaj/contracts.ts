import { z } from "zod";

export const MIRAAJ_CAPABILITIES = [
  "campaign.strategy.generate", "campaign.package.generate", "campaign.copy.generate",
  "campaign.localize", "campaign.quality.review", "campaign.compliance.review",
  "content.summarize", "content.translate", "content.classify", "content.extract",
  "moderation.evaluate",
] as const;
export const miraajCapabilitySchema = z.enum(MIRAAJ_CAPABILITIES);
export type MiraajCapability = z.infer<typeof miraajCapabilitySchema>;

export const executionPolicySchema = z.object({
  quality: z.enum(["fast", "balanced", "high"]).optional(),
  latencyPreference: z.enum(["low", "balanced", "quality"]).optional(),
  privacyRequirement: z.enum(["standard", "restricted", "local_only"]).optional(),
  outputLanguage: z.string().min(2).max(16).optional(),
  structuredOutputRequired: z.boolean().optional(),
  streamingRequired: z.boolean().optional(),
}).strict();

export const createExecutionRequestSchema = z.object({
  capability: miraajCapabilitySchema,
  input: z.record(z.unknown()),
  policy: executionPolicySchema.optional(),
  callbackUrl: z.string().url().optional(),
  metadata: z.object({ campaignId: z.string().max(128).optional(), generationRunId: z.string().max(128).optional() }).strict().optional(),
}).strict();
export type CreateExecutionRequest = z.infer<typeof createExecutionRequestSchema>;

export const usageMetadataSchema = z.object({
  inputUnits: z.number().nonnegative().optional(), outputUnits: z.number().nonnegative().optional(),
  totalUnits: z.number().nonnegative().optional(), unitType: z.string().max(64).optional(),
  cost: z.string().regex(/^\d+(\.\d{1,8})?$/).optional(), currency: z.string().max(8).optional(),
}).strict();

export const executionErrorSchema = z.object({
  code: z.string().min(1).max(128), message: z.string().min(1).max(2000),
  retryable: z.boolean(), externalTraceId: z.string().max(256).optional(),
}).strict();

export const executionResultSchema = z.object({
  output: z.record(z.unknown()), usage: usageMetadataSchema.optional(),
  outputSchemaVersion: z.string().min(1).max(32).default("v1"),
}).strict();

export const externalStatusSchema = z.enum(["accepted", "queued", "running", "succeeded", "failed", "cancelling", "cancelled"]);
export const executionResponseSchema = z.object({
  executionId: z.string().min(1).max(128), status: externalStatusSchema,
  createdAt: z.string().datetime().optional(), updatedAt: z.string().datetime().optional(),
  result: executionResultSchema.optional(), error: executionErrorSchema.optional(),
}).strict();
export type MiraajExecutionResponse = z.infer<typeof executionResponseSchema>;

export const cancelExecutionResponseSchema = z.object({
  executionId: z.string().min(1).max(128), status: z.enum(["cancelling", "cancelled"]),
}).strict();

export const healthResponseSchema = z.object({
  status: z.enum(["healthy", "degraded", "unavailable"]),
  apiVersion: z.string().min(1).max(32), timestamp: z.string().datetime(),
  capabilities: z.array(miraajCapabilitySchema).optional(),
}).strict();

export const webhookEventSchema = z.object({
  eventId: z.string().min(1).max(128),
  eventType: z.enum(["execution.accepted", "execution.queued", "execution.started", "execution.progress", "execution.completed", "execution.failed", "execution.cancelled"]),
  occurredAt: z.string().datetime(), tenantId: z.string().min(1).max(128),
  execution: executionResponseSchema,
}).strict();
export type MiraajWebhookEvent = z.infer<typeof webhookEventSchema>;
