/**
 * Campaign Intelligence — unit tests (no external AI, no paid providers).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  campaignBriefSchema,
  generateRequestSchema,
} from "../../src/campaignIntelligence/validation/schemas";
import {
  validateAssetDeterministic,
  detectLanguageMismatch,
  localeForLanguage,
  textDirection,
  channelDefaultAssetType,
} from "../../src/campaignIntelligence/services/deterministicValidation";
import { FakeCampaignIntelligenceProvider } from "../../src/campaignIntelligence/providers/fakeProvider";
import { INTEL_CAMPAIGN_STATUSES, CHANNELS, LANGUAGES } from "../../src/campaignIntelligence/constants";
import { buildCampaignIntelCacheKey } from "../../src/campaignIntelligence/services/cacheService";
import {
  contentOutputSchema,
  strategyOutputSchema,
} from "../../src/campaignIntelligence/providers/outputSchemas";
import { addMoney } from "../../src/domain/shared/baseSchema";
import { CampaignAsset } from "../../src/campaignIntelligence/models/CampaignAsset";

describe("campaign intelligence validation", () => {
  it("accepts a valid brief and normalizes language/channel enums", () => {
    const parsed = campaignBriefSchema.parse({
      name: "Launch",
      productOrService: "Tasks.cash",
      campaignObjective: "Acquire explorers",
      languages: ["en", "ar", "fr"],
      primaryLanguage: "en",
      channels: ["instagram_reel", "email"],
      funnelStage: "awareness",
      targetCountries: ["SA", "fr"],
    });
    assert.equal(parsed.primaryLanguage, "en");
    assert.deepEqual(parsed.languages, ["en", "ar", "fr"]);
    assert.ok(parsed.channels.includes("instagram_reel"));
  });

  it("rejects primaryLanguage outside languages", () => {
    assert.throws(() =>
      campaignBriefSchema.parse({
        name: "X",
        productOrService: "Y",
        campaignObjective: "Z",
        languages: ["en"],
        primaryLanguage: "ar",
        channels: ["email"],
        funnelStage: "conversion",
      })
    );
  });

  it("requires idempotencyKey on generate requests", () => {
    assert.throws(() => generateRequestSchema.parse({ runType: "package" }));
    const ok = generateRequestSchema.parse({
      idempotencyKey: "idem-key-12345",
      runType: "strategy",
    });
    assert.equal(ok.runType, "strategy");
  });
});

describe("locale and language helpers", () => {
  it("maps languages to locales and text direction", () => {
    assert.equal(localeForLanguage("ar"), "ar-SA");
    assert.equal(localeForLanguage("fr"), "fr-FR");
    assert.equal(localeForLanguage("en"), "en-US");
    assert.equal(textDirection("ar"), "rtl");
    assert.equal(textDirection("en"), "ltr");
  });

  it("detects language mismatch for Arabic expectation", () => {
    assert.equal(
      detectLanguageMismatch("This is a long English body without Arabic script at all.", "ar"),
      true
    );
    assert.equal(detectLanguageMismatch("عرض مخصص للمنتج مع قيمة واضحة للمستخدم", "ar"), false);
  });

  it("maps channels to default asset types", () => {
    assert.equal(channelDefaultAssetType("tiktok"), "tiktok");
    assert.equal(channelDefaultAssetType("email"), "email_body");
    assert.ok(CHANNELS.includes("facebook"));
    assert.ok(LANGUAGES.includes("fr"));
  });
});

describe("deterministic validation", () => {
  it("flags missing CTA, placeholders, forbidden phrases", () => {
    const r = validateAssetDeterministic({
      content: {
        body: "Buy now {{PLACEHOLDER}} guaranteed miracle",
        callToAction: undefined,
      },
      language: "en",
      channel: "facebook",
      assetType: "social_post",
      forbiddenPhrases: ["miracle"],
    });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => /CTA/i.test(e)));
    assert.ok(r.errors.some((e) => /Placeholder/i.test(e)));
    assert.ok(r.errors.some((e) => /Forbidden/i.test(e)));
  });

  it("passes a clean asset", () => {
    const r = validateAssetDeterministic({
      content: {
        body: "Clear benefit for explorers. Start today.",
        callToAction: "Start today",
        hashtags: ["#TasksCash"],
      },
      language: "en",
      channel: "instagram_post",
      assetType: "social_post",
    });
    assert.equal(r.ok, true);
  });
});

describe("fake provider", () => {
  it("returns structured strategy and localized Arabic without silent empty output", async () => {
    const p = new FakeCampaignIntelligenceProvider();
    const strategy = await p.generateStrategy({
      campaign: { name: "Demo", funnelStage: "awareness", marketCountries: ["SA"] },
      brand: null,
      audience: null,
      brief: { campaignObjective: "Grow", primaryCta: "Join" },
      primaryLanguage: "en",
      languages: ["en", "ar", "fr"],
      channels: ["email"],
    });
    assert.ok(strategy.campaignSummary.length > 10);
    assert.equal(strategy.usage.provider, "fake");

    const asset = await p.generateAsset({
      campaign: { name: "Demo" },
      strategy: {},
      language: "en",
      locale: "en-US",
      channel: "email",
      assetType: "email_body",
      variant: "balanced",
      sourceLanguage: "en",
    });
    assert.ok(asset.content.callToAction);

    const loc = await p.localize({
      sourceLanguage: "en",
      targetLanguage: "ar",
      targetLocale: "ar-SA",
      content: asset.content,
      channel: "email",
      assetType: "email_body",
    });
    assert.equal(loc.localizationMethod, "localized_from_source");
    assert.ok(/[\u0600-\u06FF]/.test(loc.content.body || ""));
  });
});

describe("provider contracts and cost accounting", () => {
  it("rejects malformed structured provider output", () => {
    assert.throws(() => contentOutputSchema.parse({ content: { body: "ok" } }));
    assert.throws(() => strategyOutputSchema.parse({ campaignSummary: "incomplete" }));
  });

  it("adds provider costs using fixed-point money helpers", () => {
    assert.equal(addMoney("0.1001", "0.2002"), "0.3003");
  });
});

describe("status enums and cache keys", () => {
  it("uses controlled campaign statuses", () => {
    assert.ok(INTEL_CAMPAIGN_STATUSES.includes("draft"));
    assert.ok(INTEL_CAMPAIGN_STATUSES.includes("partially_ready"));
    assert.ok(!INTEL_CAMPAIGN_STATUSES.includes("whatever"));
  });

  it("builds tenant-scoped cache keys", () => {
    assert.equal(
      buildCampaignIntelCacheKey("tenant_a", "icm_abc"),
      "campaign:intel:v1:tenant_a:icm_abc"
    );
  });

  it("enforces one asset per package/language/channel/variant/type", () => {
    const index = CampaignAsset.schema.indexes().find(
      ([fields]) => fields.packageVersionId === 1 && fields.language === 1 && fields.variant === 1
    );
    assert.equal(index?.[1]?.unique, true);
  });
});
