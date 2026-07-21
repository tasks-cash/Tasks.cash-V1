import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { OpenAiCampaignIntelligenceProvider } from "../../src/campaignIntelligence/providers/openAiProvider";
import { ProviderNotConfiguredError, ProviderRetryableError } from "../../src/campaignIntelligence/providers/types";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.CAMPAIGN_OPENAI_API_KEY;
  delete process.env.CAMPAIGN_OPENAI_BASE_URL;
});

describe("production campaign provider", () => {
  it("requires runtime credentials and never embeds a key", async () => {
    await assert.rejects(
      () => new OpenAiCampaignIntelligenceProvider().evaluateCompliance({ content: {}, language: "en", channel: "email" }),
      ProviderNotConfiguredError
    );
  });

  it("maps rate limits to retryable provider errors", async () => {
    process.env.CAMPAIGN_OPENAI_API_KEY = "runtime-secret";
    process.env.CAMPAIGN_OPENAI_BASE_URL = "https://provider.invalid/v1";
    globalThis.fetch = async () => new Response("rate limited", { status: 429 });
    await assert.rejects(
      () => new OpenAiCampaignIntelligenceProvider().evaluateCompliance({ content: {}, language: "en", channel: "email" }),
      ProviderRetryableError
    );
  });
});
