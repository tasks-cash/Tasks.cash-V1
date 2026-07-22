/**
 * Provider-agnostic AI interfaces for Campaign Intelligence.
 */

export interface ProviderUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostMinor: string; // decimal string in currency minor units / major as money string
  actualCostMinor?: string;
  currency: string;
  provider: string;
  model: string;
  requestCount: number;
}

export interface StrategyGenerationInput {
  tenantId: string;
  signal?: AbortSignal;
  campaign: Record<string, unknown>;
  brand?: Record<string, unknown> | null;
  audience?: Record<string, unknown> | null;
  brief: Record<string, unknown>;
  primaryLanguage: string;
  languages: string[];
  channels: string[];
}

export interface StrategyGenerationOutput {
  campaignSummary: string;
  objectiveAnalysis: Record<string, unknown>;
  audienceAnalysis: Record<string, unknown>;
  marketContext: Record<string, unknown>;
  positioning: Record<string, unknown>;
  messagePillars: unknown[];
  hooks: unknown[];
  objectionsAndResponses: unknown[];
  funnelStrategy: Record<string, unknown>;
  channelStrategy: Record<string, unknown>;
  languageStrategy: Record<string, unknown>;
  contentPlan: Record<string, unknown>;
  experimentationPlan: Record<string, unknown>;
  measurementPlan: Record<string, unknown>;
  risks: unknown[];
  complianceNotes: string[];
  usage: ProviderUsage;
  promptVersion: string;
  modelMetadata: Record<string, unknown>;
}

export interface ContentGenerationInput {
  tenantId: string;
  signal?: AbortSignal;
  campaign: Record<string, unknown>;
  strategy: Record<string, unknown>;
  brand?: Record<string, unknown> | null;
  language: string;
  locale: string;
  channel: string;
  assetType: string;
  variant: string;
  sourceLanguage: string;
}

export interface GeneratedAssetContent {
  title?: string;
  hook?: string;
  body?: string;
  callToAction?: string;
  description?: string;
  hashtags?: string[];
  keywords?: string[];
  script?: string;
  shotList?: unknown[];
  captions?: string;
  thumbnailBrief?: string;
  visualBrief?: string;
  audioBrief?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  publishingRecommendations?: string[];
  complianceNotes?: string[];
}

export interface ContentGenerationOutput {
  content: GeneratedAssetContent;
  usage: ProviderUsage;
  promptVersion: string;
  modelMetadata: Record<string, unknown>;
}

export interface LocalizationInput {
  tenantId: string;
  signal?: AbortSignal;
  sourceLanguage: string;
  targetLanguage: string;
  targetLocale: string;
  content: GeneratedAssetContent;
  brand?: Record<string, unknown> | null;
  channel: string;
  assetType: string;
}

export interface LocalizationOutput {
  content: GeneratedAssetContent;
  localizationMethod: "generated_direct" | "localized_from_source" | "manual";
  usage: ProviderUsage;
  promptVersion: string;
}

export interface QualityEvaluationInput {
  tenantId: string;
  signal?: AbortSignal;
  content: GeneratedAssetContent;
  language: string;
  channel: string;
  brand?: Record<string, unknown> | null;
}

export interface QualityEvaluationOutput {
  scores: {
    relevance: number;
    clarity: number;
    brandAlignment: number;
    persuasiveness: number;
    culturalAppropriateness: number;
    channelFit: number;
    factualConsistency: number;
    ctaQuality: number;
  };
  qualityScore: number;
  notes: string[];
  usage: ProviderUsage;
}

export interface ComplianceEvaluationInput {
  tenantId: string;
  signal?: AbortSignal;
  content: GeneratedAssetContent;
  brand?: Record<string, unknown> | null;
  language: string;
  channel: string;
}

export interface ComplianceEvaluationOutput {
  passed: boolean;
  errors: string[];
  notes: string[];
  usage: ProviderUsage;
}

export interface CampaignStrategyGenerator {
  generateStrategy(input: StrategyGenerationInput): Promise<StrategyGenerationOutput>;
}

export interface CampaignContentGenerator {
  generateAsset(input: ContentGenerationInput): Promise<ContentGenerationOutput>;
}

export interface CampaignLocalizationProvider {
  localize(input: LocalizationInput): Promise<LocalizationOutput>;
}

export interface CampaignQualityEvaluator {
  evaluateQuality(input: QualityEvaluationInput): Promise<QualityEvaluationOutput>;
}

export interface CampaignComplianceEvaluator {
  evaluateCompliance(input: ComplianceEvaluationInput): Promise<ComplianceEvaluationOutput>;
}

export interface CampaignIntelligenceProvider
  extends CampaignStrategyGenerator,
    CampaignContentGenerator,
    CampaignLocalizationProvider,
    CampaignQualityEvaluator,
    CampaignComplianceEvaluator {
  readonly name: string;
}

export class ProviderNotConfiguredError extends Error {
  constructor(message = "Campaign AI provider is not configured") {
    super(message);
    this.name = "ProviderNotConfiguredError";
  }
}

export class ProviderRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderRetryableError";
  }
}

export class ProviderPermanentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderPermanentError";
  }
}

export class ProviderCancelledError extends Error {
  constructor(message = "Campaign provider request cancelled") {
    super(message);
    this.name = "ProviderCancelledError";
  }
}
