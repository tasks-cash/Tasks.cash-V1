/** Runtime validation for untrusted structured AI-provider output. */
import { z } from "zod";

const usageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  estimatedCostMinor: z.string().regex(/^\d{1,15}(\.\d{1,4})?$/),
  actualCostMinor: z.string().regex(/^\d{1,15}(\.\d{1,4})?$/).optional(),
  currency: z.string().length(3),
  provider: z.string().min(1).max(64),
  model: z.string().min(1).max(128),
  requestCount: z.number().int().positive(),
}).superRefine((value, ctx) => {
  if (value.totalTokens !== value.inputTokens + value.outputTokens) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "totalTokens must equal inputTokens + outputTokens" });
  }
});

export const generatedAssetContentSchema = z.object({
  title: z.string().max(500).optional(),
  hook: z.string().max(2_000).optional(),
  body: z.string().max(50_000).optional(),
  callToAction: z.string().max(500).optional(),
  description: z.string().max(5_000).optional(),
  hashtags: z.array(z.string().max(100)).max(100).optional(),
  keywords: z.array(z.string().max(100)).max(100).optional(),
  script: z.string().max(50_000).optional(),
  shotList: z.array(z.unknown()).max(200).optional(),
  captions: z.string().max(10_000).optional(),
  thumbnailBrief: z.string().max(5_000).optional(),
  visualBrief: z.string().max(5_000).optional(),
  audioBrief: z.string().max(5_000).optional(),
  durationSeconds: z.number().nonnegative().max(86_400).optional(),
  aspectRatio: z.string().max(16).optional(),
  publishingRecommendations: z.array(z.string().max(1_000)).max(50).optional(),
  complianceNotes: z.array(z.string().max(2_000)).max(50).optional(),
}).strict();

export const strategyOutputSchema = z.object({
  campaignSummary: z.string().min(1).max(20_000),
  objectiveAnalysis: z.record(z.unknown()),
  audienceAnalysis: z.record(z.unknown()),
  marketContext: z.record(z.unknown()),
  positioning: z.record(z.unknown()),
  messagePillars: z.array(z.unknown()),
  hooks: z.array(z.unknown()),
  objectionsAndResponses: z.array(z.unknown()),
  funnelStrategy: z.record(z.unknown()),
  channelStrategy: z.record(z.unknown()),
  languageStrategy: z.record(z.unknown()),
  contentPlan: z.record(z.unknown()),
  experimentationPlan: z.record(z.unknown()),
  measurementPlan: z.record(z.unknown()),
  risks: z.array(z.unknown()),
  complianceNotes: z.array(z.string().max(2_000)),
  usage: usageSchema,
  promptVersion: z.string().min(1).max(64),
  modelMetadata: z.record(z.unknown()),
}).strict();

export const contentOutputSchema = z.object({
  content: generatedAssetContentSchema,
  usage: usageSchema,
  promptVersion: z.string().min(1).max(64),
  modelMetadata: z.record(z.unknown()),
}).strict();

export const localizationOutputSchema = z.object({
  content: generatedAssetContentSchema,
  localizationMethod: z.enum(["generated_direct", "localized_from_source", "manual"]),
  usage: usageSchema,
  promptVersion: z.string().min(1).max(64),
}).strict();

export const qualityOutputSchema = z.object({
  scores: z.object({
    relevance: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    brandAlignment: z.number().min(0).max(100),
    persuasiveness: z.number().min(0).max(100),
    culturalAppropriateness: z.number().min(0).max(100),
    channelFit: z.number().min(0).max(100),
    factualConsistency: z.number().min(0).max(100),
    ctaQuality: z.number().min(0).max(100),
  }).strict(),
  qualityScore: z.number().min(0).max(100),
  notes: z.array(z.string().max(2_000)),
  usage: usageSchema,
}).strict();

export const complianceOutputSchema = z.object({
  passed: z.boolean(),
  errors: z.array(z.string().max(2_000)),
  notes: z.array(z.string().max(2_000)),
  usage: usageSchema,
}).strict();
