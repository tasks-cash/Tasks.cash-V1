/**
 * Resolve Campaign Intelligence AI provider.
 */

import { getCampaignIntelligenceConfig } from "../config";
import { FakeCampaignIntelligenceProvider } from "./fakeProvider";
import { OpenAiCampaignIntelligenceProvider } from "./openAiProvider";
import {
  ProviderNotConfiguredError,
  type CampaignIntelligenceProvider,
} from "./types";

let cached: CampaignIntelligenceProvider | null = null;

export function getCampaignIntelligenceProvider(): CampaignIntelligenceProvider {
  if (cached) return cached;
  const cfg = getCampaignIntelligenceConfig();
  if (cfg.provider === "fake") {
    cached = new FakeCampaignIntelligenceProvider();
    return cached;
  }
  if (cfg.provider === "openai") {
    if (!cfg.openAiApiKey) throw new ProviderNotConfiguredError("CAMPAIGN_OPENAI_API_KEY is required when CAMPAIGN_AI_PROVIDER=openai");
    cached = new OpenAiCampaignIntelligenceProvider();
    return cached;
  }
  throw new ProviderNotConfiguredError(
    "Configure CAMPAIGN_AI_PROVIDER=openai and its runtime credentials; the fake provider is test-only"
  );
}

export function resetCampaignProviderForTests(): void {
  cached = null;
}
