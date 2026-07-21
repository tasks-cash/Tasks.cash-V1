/**
 * Campaign Intelligence configuration.
 */

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export type CampaignAiProviderName = "openai" | "fake" | "none";

export interface CampaignIntelligenceConfig {
  enabled: boolean;
  /** fake = deterministic test provider; none = fail clearly in production */
  provider: CampaignAiProviderName;
  cacheTtlSeconds: number;
  maxConcurrentGenerationsPerCampaign: number;
  defaultVariants: string[];
  openAiApiKey?: string;
  openAiBaseUrl: string;
  openAiModel: string;
  providerTimeoutMs: number;
}

export function getCampaignIntelligenceConfig(): CampaignIntelligenceConfig {
  const raw = (process.env.CAMPAIGN_AI_PROVIDER ?? "").toLowerCase();
  let provider: CampaignAiProviderName = "none";
  if (process.env.NODE_ENV === "test") provider = "fake";
  else if (raw === "openai") provider = "openai";
  else if (raw === "none" || raw === "") provider = "none";

  return {
    enabled: bool("CAMPAIGN_INTELLIGENCE_ENABLED", true),
    provider,
    cacheTtlSeconds: Number(process.env.CAMPAIGN_CACHE_TTL_SECONDS ?? 300) || 300,
    maxConcurrentGenerationsPerCampaign: 1,
    defaultVariants: ["conservative", "balanced", "bold"],
    openAiApiKey: process.env.CAMPAIGN_OPENAI_API_KEY?.trim() || undefined,
    openAiBaseUrl: (process.env.CAMPAIGN_OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    openAiModel: process.env.CAMPAIGN_OPENAI_MODEL ?? "gpt-4.1-mini",
    providerTimeoutMs: Math.min(300_000, Math.max(1_000, Number(process.env.CAMPAIGN_PROVIDER_TIMEOUT_MS ?? 90_000) || 90_000)),
  };
}
