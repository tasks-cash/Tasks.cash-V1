/**
 * Zod contracts for Campaign Intelligence briefs and profiles.
 */

import { z } from "zod";
import {
  CHANNELS,
  FUNNEL_STAGES,
  LANGUAGES,
  LOCALES,
  VARIANTS,
} from "../constants";

const languageSchema = z.enum(LANGUAGES);
const channelSchema = z.enum(CHANNELS);
const localeSchema = z.enum(LOCALES);

export const createBrandProfileSchema = z.object({
  name: z.string().min(1).max(200),
  companyDescription: z.string().max(5_000).optional(),
  products: z.array(z.string().max(200)).max(50).default([]),
  services: z.array(z.string().max(200)).max(50).default([]),
  valuePropositions: z.array(z.string().max(500)).max(30).default([]),
  brandVoice: z.string().max(1_000).optional(),
  toneRules: z.array(z.string().max(300)).max(30).default([]),
  forbiddenPhrases: z.array(z.string().max(200)).max(100).default([]),
  preferredTerminology: z.array(z.string().max(200)).max(100).default([]),
  legalDisclaimers: z.array(z.string().max(1_000)).max(20).default([]),
  complianceRules: z.array(z.string().max(500)).max(50).default([]),
  visualGuidelines: z.string().max(2_000).optional(),
  targetMarkets: z.array(z.string().max(8)).max(50).default([]),
  supportedLanguages: z.array(languageSchema).min(1).default(["en"]),
  website: z.string().url().max(500).optional().or(z.literal("")),
  socialProfiles: z.record(z.string().max(500)).default({}),
  competitorNames: z.array(z.string().max(200)).max(30).default([]),
  metadata: z.record(z.unknown()).optional(),
  active: z.boolean().default(true),
});

export const updateBrandProfileSchema = createBrandProfileSchema.partial();

export const createAudienceProfileSchema = z.object({
  name: z.string().min(1).max(200),
  demographics: z.record(z.unknown()).default({}),
  locations: z.array(z.string().max(64)).max(50).default([]),
  languages: z.array(languageSchema).min(1).default(["en"]),
  interests: z.array(z.string().max(200)).max(50).default([]),
  pains: z.array(z.string().max(500)).max(30).default([]),
  desires: z.array(z.string().max(500)).max(30).default([]),
  objections: z.array(z.string().max(500)).max(30).default([]),
  buyingMotivations: z.array(z.string().max(500)).max(30).default([]),
  awarenessLevel: z.enum(["unaware", "problem_aware", "solution_aware", "product_aware", "most_aware"]).optional(),
  preferredChannels: z.array(channelSchema).max(20).default([]),
  behavioralSignals: z.array(z.string().max(300)).max(50).default([]),
  exclusions: z.array(z.string().max(300)).max(50).default([]),
  metadata: z.record(z.unknown()).optional(),
  active: z.boolean().default(true),
});

export const updateAudienceProfileSchema = createAudienceProfileSchema.partial();

export const campaignBriefSchema = z
  .object({
    name: z.string().min(1).max(200),
    internalDescription: z.string().max(5_000).optional(),
    productOrService: z.string().min(1).max(500),
    businessObjective: z.string().max(2_000).optional(),
    campaignObjective: z.string().min(1).max(2_000),
    offer: z.string().max(1_000).optional(),
    targetAudience: z.string().max(2_000).optional(),
    targetCountries: z.array(z.string().min(2).max(8)).max(50).default([]),
    languages: z.array(languageSchema).min(1).max(3).default(["en"]),
    primaryLanguage: languageSchema.default("en"),
    channels: z.array(channelSchema).min(1).max(10),
    funnelStage: z.enum(FUNNEL_STAGES),
    desiredTone: z.string().max(500).optional(),
    campaignStartAt: z.string().datetime().optional(),
    campaignEndAt: z.string().datetime().optional(),
    timezone: z.string().max(64).default("UTC"),
    budgetRange: z
      .object({
        min: z.string().max(32).optional(),
        max: z.string().max(32).optional(),
        currency: z.string().length(3).optional(),
      })
      .optional(),
    primaryCta: z.string().max(200).optional(),
    productFacts: z.array(z.string().max(500)).max(50).default([]),
    proofPoints: z.array(z.string().max(500)).max(50).default([]),
    restrictions: z.array(z.string().max(500)).max(50).default([]),
    mandatoryStatements: z.array(z.string().max(1_000)).max(20).default([]),
    prohibitedStatements: z.array(z.string().max(500)).max(50).default([]),
    competitorReferences: z.array(z.string().max(200)).max(30).default([]),
    additionalInstructions: z.string().max(5_000).optional(),
    brandProfileId: z.string().max(64).optional(),
    audienceProfileId: z.string().max(64).optional(),
    variants: z.array(z.enum(VARIANTS)).max(3).default(["balanced"]),
    locales: z.array(localeSchema).max(3).optional(),
    sourceType: z.string().max(64).default("brief"),
    idempotencyKey: z.string().max(256).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.languages.includes(val.primaryLanguage)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "primaryLanguage must be included in languages",
        path: ["primaryLanguage"],
      });
    }
    if (val.campaignStartAt && val.campaignEndAt) {
      if (new Date(val.campaignEndAt) < new Date(val.campaignStartAt)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "campaignEndAt must be on or after campaignStartAt",
          path: ["campaignEndAt"],
        });
      }
    }
  });

export const updateIntelCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  internalDescription: z.string().max(5_000).optional(),
  objective: z.string().min(1).max(2_000).optional(),
  offer: z.string().max(1_000).optional(),
  funnelStage: z.enum(FUNNEL_STAGES).optional(),
  brandProfileId: z.string().max(64).nullable().optional(),
  audienceProfileId: z.string().max(64).nullable().optional(),
  requestedLanguages: z.array(languageSchema).min(1).max(3).optional(),
  requestedChannels: z.array(channelSchema).min(1).max(10).optional(),
  campaignStartAt: z.string().datetime().nullable().optional(),
  campaignEndAt: z.string().datetime().nullable().optional(),
  timezone: z.string().max(64).optional(),
  marketCountries: z.array(z.string().max(8)).max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const generateRequestSchema = z.object({
  idempotencyKey: z.string().min(8).max(256),
  languages: z.array(languageSchema).min(1).max(3).optional(),
  channels: z.array(channelSchema).min(1).max(10).optional(),
  variants: z.array(z.enum(VARIANTS)).max(3).optional(),
  runType: z.enum(["strategy", "package", "regenerate"]).default("package"),
});

export type CampaignBriefInput = z.infer<typeof campaignBriefSchema>;
export type GenerateRequestInput = z.infer<typeof generateRequestSchema>;
