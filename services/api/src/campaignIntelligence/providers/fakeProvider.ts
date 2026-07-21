/**
 * Deterministic fake AI provider — tests and local training only.
 */

import type {
  CampaignIntelligenceProvider,
  ComplianceEvaluationInput,
  ComplianceEvaluationOutput,
  ContentGenerationInput,
  ContentGenerationOutput,
  LocalizationInput,
  LocalizationOutput,
  ProviderUsage,
  QualityEvaluationInput,
  QualityEvaluationOutput,
  StrategyGenerationInput,
  StrategyGenerationOutput,
} from "./types";

function usage(provider: string, model: string, inTok: number, outTok: number): ProviderUsage {
  return {
    inputTokens: inTok,
    outputTokens: outTok,
    totalTokens: inTok + outTok,
    estimatedCostMinor: "0.0000",
    currency: "USD",
    provider,
    model,
    requestCount: 1,
  };
}

export class FakeCampaignIntelligenceProvider implements CampaignIntelligenceProvider {
  readonly name = "fake";

  async generateStrategy(input: StrategyGenerationInput): Promise<StrategyGenerationOutput> {
    const langs = input.languages;
    const channels = input.channels;
    return {
      campaignSummary: `Strategy for ${String(input.campaign.name ?? "campaign")} targeting ${langs.join(", ")}`,
      objectiveAnalysis: { objective: input.brief.campaignObjective ?? input.campaign.objective, clarity: "high" },
      audienceAnalysis: { profile: input.audience?.name ?? "default", fit: "strong" },
      marketContext: { countries: input.campaign.marketCountries ?? [], competition: "moderate" },
      positioning: { statement: "Clear value for the stated audience", differentiators: ["trust", "clarity"] },
      messagePillars: [
        { pillar: "Benefit", message: "Solve the core pain quickly" },
        { pillar: "Proof", message: "Use product facts only" },
        { pillar: "CTA", message: String(input.brief.primaryCta ?? "Learn more") },
      ],
      hooks: [{ text: "Start with the outcome, not the feature", variant: "balanced" }],
      objectionsAndResponses: [{ objection: "Too expensive", response: "Emphasize value and proof" }],
      funnelStrategy: { stage: input.campaign.funnelStage, steps: ["hook", "value", "cta"] },
      channelStrategy: Object.fromEntries(channels.map((c) => [c, { format: c, priority: "medium" }])),
      languageStrategy: Object.fromEntries(
        langs.map((l) => [l, { direction: l === "ar" ? "rtl" : "ltr", locale: localeFor(l) }])
      ),
      contentPlan: { assetsPerChannel: 1, variants: ["conservative", "balanced", "bold"] },
      experimentationPlan: { tests: ["hook_a_b"] },
      measurementPlan: { kpis: ["ctr", "cvr"] },
      risks: ["Do not invent product claims"],
      complianceNotes: ["Respect brand forbidden phrases and mandatory statements"],
      usage: usage("fake", "fake-strategy-v1", 120, 400),
      promptVersion: "fake-strategy-v1",
      modelMetadata: { provider: "fake", deterministic: true },
    };
  }

  async generateAsset(input: ContentGenerationInput): Promise<ContentGenerationOutput> {
    const name = String(input.campaign.name ?? "Campaign");
    const cta = "Learn more";
    const body = `[${input.language}/${input.channel}/${input.variant}] ${name}: clear benefit. ${cta}.`;
    return {
      content: {
        title: `${name} — ${input.channel}`,
        hook: `Discover ${name}`,
        body,
        callToAction: cta,
        description: body,
        hashtags: ["#TasksCash", "#Campaign"],
        keywords: [name.toLowerCase(), input.channel],
        script: input.assetType.includes("video") || input.assetType.includes("reel") || input.assetType === "tiktok"
          ? `HOOK: Discover ${name}\nBODY: Benefit in 15s\nCTA: ${cta}`
          : undefined,
        shotList: input.assetType.includes("video") ? [{ shot: 1, description: "Product hero" }] : undefined,
        captions: body,
        thumbnailBrief: "Bright product-first frame",
        visualBrief: "Clean brand-safe visual",
        audioBrief: "Upbeat, no claims beyond brief",
        durationSeconds: input.channel.includes("reel") || input.channel === "tiktok" ? 20 : undefined,
        aspectRatio: input.channel.includes("story") ? "9:16" : "1:1",
        publishingRecommendations: [`Post in ${input.locale}`, "Avoid prohibited claims"],
        complianceNotes: [],
      },
      usage: usage("fake", "fake-content-v1", 80, 200),
      promptVersion: "fake-content-v1",
      modelMetadata: { provider: "fake", language: input.language, channel: input.channel },
    };
  }

  async localize(input: LocalizationInput): Promise<LocalizationOutput> {
    const c = input.content;
    const localizeText = (text: string | undefined): string | undefined => {
      if (!text) return text;
      if (input.targetLanguage === "ar") {
        return `عرض مخصص: ${text} — احصل على القيمة الآن`;
      }
      if (input.targetLanguage === "fr") {
        return `[fr] ${text} — Découvrez la valeur dès maintenant`;
      }
      return `[${input.targetLanguage}] ${text}`;
    };
    return {
      content: {
        ...c,
        title: localizeText(c.title),
        hook: localizeText(c.hook),
        body: localizeText(c.body),
        callToAction: localizeText(c.callToAction),
        description: localizeText(c.description),
        captions: localizeText(c.captions),
        script: localizeText(c.script),
      },
      localizationMethod: "localized_from_source",
      usage: usage("fake", "fake-localize-v1", 60, 120),
      promptVersion: "fake-localize-v1",
    };
  }

  async evaluateQuality(input: QualityEvaluationInput): Promise<QualityEvaluationOutput> {
    const scores = {
      relevance: 0.85,
      clarity: 0.88,
      brandAlignment: 0.8,
      persuasiveness: 0.78,
      culturalAppropriateness: input.language === "ar" ? 0.82 : 0.86,
      channelFit: 0.84,
      factualConsistency: 0.9,
      ctaQuality: input.content.callToAction ? 0.87 : 0.4,
    };
    const qualityScore =
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    return {
      scores,
      qualityScore: Math.round(qualityScore * 1000) / 1000,
      notes: ["Deterministic fake evaluation"],
      usage: usage("fake", "fake-quality-v1", 40, 40),
    };
  }

  async evaluateCompliance(input: ComplianceEvaluationInput): Promise<ComplianceEvaluationOutput> {
    const errors: string[] = [];
    if (!input.content.callToAction) errors.push("CTA missing");
    if (!input.content.body && !input.content.script) errors.push("Body or script required");
    return {
      passed: errors.length === 0,
      errors,
      notes: ["Deterministic fake compliance"],
      usage: usage("fake", "fake-compliance-v1", 30, 20),
    };
  }
}

function localeFor(lang: string): string {
  if (lang === "ar") return "ar-SA";
  if (lang === "fr") return "fr-FR";
  return "en-US";
}
