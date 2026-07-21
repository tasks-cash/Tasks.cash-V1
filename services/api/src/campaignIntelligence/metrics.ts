/**
 * In-process Campaign Intelligence counters (low cardinality).
 */

import { getCampaignIntelligenceConfig } from "./config";

const state = {
  generationRequests: 0,
  generationSuccess: 0,
  generationFailure: 0,
  generationCancellation: 0,
  assetsGenerated: 0,
  validationFailures: 0,
  providerErrors: 0,
  retries: 0,
  generationDurationMsTotal: 0,
  generationDurationCount: 0,
  tokenUsageTotal: 0,
  strategyDurationMsTotal: 0,
  strategyDurationCount: 0,
  packageDurationMsTotal: 0,
  packageDurationCount: 0,
  activeGenerationRuns: 0,
};

export const campaignIntelMetrics = {
  request() {
    state.generationRequests += 1;
  },
  success(durationMs: number, kind?: "strategy" | "package") {
    state.generationSuccess += 1;
    state.generationDurationMsTotal += durationMs;
    state.generationDurationCount += 1;
    if (kind === "strategy") {
      state.strategyDurationMsTotal += durationMs;
      state.strategyDurationCount += 1;
    } else if (kind === "package") {
      state.packageDurationMsTotal += durationMs;
      state.packageDurationCount += 1;
    }
  },
  failure() {
    state.generationFailure += 1;
  },
  cancel() {
    state.generationCancellation += 1;
  },
  assets(n: number) {
    state.assetsGenerated += n;
  },
  validationFailure(n = 1) {
    state.validationFailures += n;
  },
  providerError() {
    state.providerErrors += 1;
  },
  retry() {
    state.retries += 1;
  },
  tokens(n: number) {
    state.tokenUsageTotal += n;
  },
  active(delta: 1 | -1) {
    state.activeGenerationRuns = Math.max(0, state.activeGenerationRuns + delta);
  },
  snapshot() {
    return { ...state };
  },
};

export function getCampaignIntelligenceDiagnostics(): Record<string, unknown> {
  const cfg = getCampaignIntelligenceConfig();
  return {
    enabled: cfg.enabled,
    provider: cfg.provider,
    cacheTtlSeconds: cfg.cacheTtlSeconds,
    metrics: campaignIntelMetrics.snapshot(),
  };
}
