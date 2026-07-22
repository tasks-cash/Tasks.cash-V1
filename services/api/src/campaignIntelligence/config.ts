/**
 * Campaign Intelligence configuration.
 */

function bool(name: string, fallback: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

export type CampaignAiProviderName = "miraaj" | "fake" | "none";

export interface CampaignIntelligenceConfig {
  enabled: boolean;
  /** fake = deterministic test provider; none = fail clearly in production */
  provider: CampaignAiProviderName;
  cacheTtlSeconds: number;
  maxConcurrentGenerationsPerCampaign: number;
  defaultVariants: string[];
  providerTimeoutMs: number;
}

export function getCampaignIntelligenceConfig(): CampaignIntelligenceConfig {
  const raw = (process.env.CAMPAIGN_AI_PROVIDER ?? "").toLowerCase();
  let provider: CampaignAiProviderName = "none";
  if (process.env.NODE_ENV === "test") provider = "fake";
  else if (raw === "miraaj") provider = "miraaj";
  else if (raw === "none" || raw === "") provider = "none";

  return {
    enabled: bool("CAMPAIGN_INTELLIGENCE_ENABLED", true),
    provider,
    cacheTtlSeconds: Number(process.env.CAMPAIGN_CACHE_TTL_SECONDS ?? 300) || 300,
    maxConcurrentGenerationsPerCampaign: 1,
    defaultVariants: ["conservative", "balanced", "bold"],
    providerTimeoutMs: Math.min(300_000, Math.max(1_000, Number(process.env.CAMPAIGN_PROVIDER_TIMEOUT_MS ?? 90_000) || 90_000)),
  };
}
