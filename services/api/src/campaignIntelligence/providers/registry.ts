/**
 * Resolve Campaign Intelligence AI provider.
 */

import { getCampaignIntelligenceConfig } from "../config";
import { FakeCampaignIntelligenceProvider } from "./fakeProvider";
import { MiraajCampaignIntelligenceProvider } from "./miraajProvider";
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
  if (cfg.provider === "miraaj") {
    cached = new MiraajCampaignIntelligenceProvider();
    return cached;
  }
  throw new ProviderNotConfiguredError(
    "Configure CAMPAIGN_AI_PROVIDER=miraaj and the server-side Miraaj API connection; the fake provider is test-only"
  );
}

export function resetCampaignProviderForTests(): void {
  cached = null;
}
