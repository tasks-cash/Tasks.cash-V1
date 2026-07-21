/** Campaign Intelligence — Phase 8 public exports. */

export { EVENT_TYPES_CI } from "./events";
export { getCampaignIntelligenceConfig } from "./config";
export { getCampaignIntelligenceProvider, resetCampaignProviderForTests } from "./providers/registry";
export { getCampaignIntelligenceDiagnostics, campaignIntelMetrics } from "./metrics";
export * from "./models";
export * from "./constants";
