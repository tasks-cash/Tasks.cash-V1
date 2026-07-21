/**
 * Resumable Campaign Intelligence generation pipeline (BullMQ worker entry).
 */

import { IntelCampaign } from "../models/IntelCampaign";
import { BrandProfile } from "../models/BrandProfile";
import { AudienceProfile } from "../models/AudienceProfile";
import { CampaignStrategyVersion } from "../models/CampaignStrategyVersion";
import { CampaignPackageVersion } from "../models/CampaignPackageVersion";
import { CampaignAsset } from "../models/CampaignAsset";
import { GenerationRun } from "../models/GenerationRun";
import { PIPELINE_STAGES, type PipelineStage, type Channel, type CampaignLanguage } from "../constants";
import { getCampaignIntelligenceProvider } from "../providers/registry";
import {
  channelDefaultAssetType,
  localeForLanguage,
  textDirection,
  validateAssetDeterministic,
} from "../services/deterministicValidation";
import { invalidateCampaignDetailCache } from "../services/cacheService";
import { recordCampaignAnalytics } from "../services/analyticsBridge";
import { campaignIntelMetrics } from "../metrics";
import { JobCancelledError, JobPermanentError, JobRetryableError } from "../../jobs/contracts/jobErrors";
import { generatePublicId } from "../../domain/shared/publicId";
import { publishDomainServiceEvent } from "../../domain/services/publishDomainEvent";
import { EVENT_TYPES_CI } from "../events";
import { logger } from "../../observability/logger";
import { toMoneyDecimal } from "../../domain/shared/baseSchema";
import { addMoney } from "../../domain/shared/baseSchema";
import type { ActorContext } from "../../domain/services/serviceTypes";
import { ProviderCancelledError, ProviderRetryableError } from "../providers/types";
import {
  complianceOutputSchema,
  contentOutputSchema,
  localizationOutputSchema,
  qualityOutputSchema,
  strategyOutputSchema,
} from "../providers/outputSchemas";
import mongoose, { type ClientSession } from "mongoose";

async function atomicFinalization<T>(fn: (session?: ClientSession) => Promise<T>): Promise<T> {
  // Automated/local Mongo instances may be standalone. Production must provide
  // a replica set so the final package/campaign/run/outbox commit is atomic.
  if (process.env.NODE_ENV === "test") return fn(undefined);
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => { result = await fn(session); });
    return result;
  } finally {
    await session.endSession();
  }
}

function stageIndex(step?: string): number {
  if (!step) return 0;
  const i = (PIPELINE_STAGES as readonly string[]).indexOf(step);
  return i >= 0 ? i : 0;
}

async function checkpoint(
  runId: string,
  tenantId: string,
  step: PipelineStage,
  progress: Record<string, unknown>
) {
  await GenerationRun.updateOne(
    { generationRunId: runId, tenantId },
    { $set: { currentStep: step, progress, updatedAt: new Date() } }
  );
}

export async function runCampaignIntelligencePipeline(input: {
  tenantId: string;
  campaignId: string;
  generationRunId: string;
  jobId: string;
  bullJobId?: string;
  correlationId?: string;
  signal?: AbortSignal;
}): Promise<Record<string, unknown>> {
  const pipelineStartedAt = Date.now();
  const run = await GenerationRun.findOne({
    generationRunId: input.generationRunId,
    tenantId: input.tenantId,
  });
  if (!run) throw new JobPermanentError("GenerationRun not found");

  // BullMQ may redeliver a completed job. Never call a provider or mutate immutable
  // output again; return the durable result from the canonical generation run.
  if (run.status === "completed") {
    return {
      ok: true,
      reused: true,
      ...(run.outputSummary ?? {}),
    };
  }

  if (run.cancellationRequestedAt || run.status === "cancelled") {
    throw new JobCancelledError("Generation cancelled");
  }
  campaignIntelMetrics.active(1);

  const startFrom = stageIndex(run.currentStep);
  const provider = getCampaignIntelligenceProvider();
  const ctx: ActorContext = {
    tenantId: input.tenantId,
    actorId: run.createdBy || "system",
  };

  await GenerationRun.updateOne(
    { _id: run._id },
    {
      $set: {
        status: "running",
        startedAt: run.startedAt ?? new Date(),
        jobId: input.jobId,
        bullJobId: input.bullJobId,
        correlationId: input.correlationId ?? run.correlationId,
        attempts: (run.attempts || 0) + 1,
      },
    }
  );

  await IntelCampaign.updateOne(
    { campaignId: input.campaignId, tenantId: input.tenantId },
    {
      $set: {
        generationStatus: "running",
        status: run.runType === "strategy" ? "analyzing" : "generating",
        lastGenerationJobId: input.jobId,
      },
    }
  );

  const campaign = await IntelCampaign.findOne({
    campaignId: input.campaignId,
    tenantId: input.tenantId,
  });
  if (!campaign) throw new JobPermanentError("Campaign not found");

  let brand = null;
  let audience = null;
  let strategyDoc = null as InstanceType<typeof CampaignStrategyVersion> | null;
  let packageDoc = null as InstanceType<typeof CampaignPackageVersion> | null;
  const createdAssetIds: string[] = [];
  let tokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, requestCount: 0 };
  let estimatedCost = "0";
  let actualCost = "0";
  let costCurrency: string | undefined;
  let providerModel: string | undefined;

  const addUsage = (u: { inputTokens: number; outputTokens: number; totalTokens: number; requestCount: number; estimatedCostMinor: string; actualCostMinor?: string; currency: string; model: string }) => {
    tokenUsage.inputTokens += u.inputTokens;
    tokenUsage.outputTokens += u.outputTokens;
    tokenUsage.totalTokens += u.totalTokens;
    tokenUsage.requestCount += u.requestCount;
    estimatedCost = addMoney(estimatedCost, u.estimatedCostMinor);
    if (u.actualCostMinor) actualCost = addMoney(actualCost, u.actualCostMinor);
    costCurrency = costCurrency ?? u.currency.toUpperCase();
    providerModel = providerModel ?? u.model;
  };

  const ensureNotCancelled = async () => {
    if (input.signal?.aborted) throw new JobCancelledError();
    const latest = await GenerationRun.findOne({ generationRunId: input.generationRunId }).select({
      cancellationRequestedAt: 1,
      status: 1,
    });
    if (latest?.cancellationRequestedAt || latest?.status === "cancelled") {
      throw new JobCancelledError("Generation cancelled");
    }
  };

  try {
    // Stages 0-4: validate + load context
    if (startFrom <= 4) {
      await checkpoint(input.generationRunId, input.tenantId, "load_brand_profile", { pct: 10 });
      if (campaign.brandProfileId) {
        brand = await BrandProfile.findOne({
          brandProfileId: campaign.brandProfileId,
          tenantId: input.tenantId,
          active: true,
        });
      }
      if (campaign.audienceProfileId) {
        audience = await AudienceProfile.findOne({
          audienceProfileId: campaign.audienceProfileId,
          tenantId: input.tenantId,
          active: true,
        });
      }
      await checkpoint(input.generationRunId, input.tenantId, "normalize_campaign_inputs", { pct: 15 });
    }

    await ensureNotCancelled();

    // Strategy generation / reuse
    const needStrategy = run.runType === "strategy" || run.runType === "package" || run.runType === "regenerate";
    if (needStrategy && startFrom <= 17) {
      await checkpoint(input.generationRunId, input.tenantId, "analyze_campaign_objective", { pct: 25 });
      await publishDomainServiceEvent({
        ctx,
        eventType:
          run.runType === "strategy"
            ? EVENT_TYPES_CI.STRATEGY_GENERATION_STARTED
            : EVENT_TYPES_CI.PACKAGE_GENERATION_STARTED,
        aggregateType: "intel_campaign",
        aggregateId: campaign.campaignId,
        payload: {
          campaignId: campaign.campaignId,
          generationRunId: input.generationRunId,
          runType: run.runType,
          jobId: input.jobId,
        },
        idempotencyKey: `ci:started:${input.generationRunId}`,
      }).catch(() => undefined);

      const brief = (run.inputSnapshot?.brief as Record<string, unknown>) ?? {};
      const strategyOut = strategyOutputSchema.parse(await provider.generateStrategy({
        signal: input.signal,
        campaign: campaign.toObject() as unknown as Record<string, unknown>,
        brand: brand ? (brand.toObject() as unknown as Record<string, unknown>) : null,
        audience: audience ? (audience.toObject() as unknown as Record<string, unknown>) : null,
        brief,
        primaryLanguage: campaign.primaryLanguage,
        languages: (run.requestedLanguages?.length ? run.requestedLanguages : campaign.requestedLanguages) as string[],
        channels: (run.requestedChannels?.length ? run.requestedChannels : campaign.requestedChannels) as string[],
      }));
      addUsage(strategyOut.usage);

      await checkpoint(input.generationRunId, input.tenantId, "persist_strategy_version", { pct: 45 });

      const nextStrategyVersion = (campaign.currentStrategyVersion ?? 0) + 1;
      // Idempotent: if this run already linked a strategy version in progress, reuse
      const existingStrategy = await CampaignStrategyVersion.findOne({
        tenantId: input.tenantId,
        campaignId: campaign.campaignId,
        generatedByJobId: input.jobId,
      });
      if (existingStrategy) {
        strategyDoc = existingStrategy;
      } else {
        await atomicFinalization(async (session) => {
        const [createdStrategy] = await CampaignStrategyVersion.create([{
          strategyVersionId: generatePublicId("strategyVersion"),
          campaignId: campaign.campaignId,
          tenantId: input.tenantId,
          appKey: campaign.appKey,
          version: nextStrategyVersion,
          status: "completed",
          inputSnapshot: { brief, runType: run.runType },
          campaignSummary: strategyOut.campaignSummary,
          objectiveAnalysis: strategyOut.objectiveAnalysis,
          audienceAnalysis: strategyOut.audienceAnalysis,
          marketContext: strategyOut.marketContext,
          positioning: strategyOut.positioning,
          messagePillars: strategyOut.messagePillars,
          hooks: strategyOut.hooks,
          objectionsAndResponses: strategyOut.objectionsAndResponses,
          funnelStrategy: strategyOut.funnelStrategy,
          channelStrategy: strategyOut.channelStrategy,
          languageStrategy: strategyOut.languageStrategy,
          contentPlan: strategyOut.contentPlan,
          experimentationPlan: strategyOut.experimentationPlan,
          measurementPlan: strategyOut.measurementPlan,
          risks: strategyOut.risks,
          complianceNotes: strategyOut.complianceNotes,
          modelMetadata: strategyOut.modelMetadata,
          promptVersion: strategyOut.promptVersion,
          generatedByJobId: input.jobId,
          createdBy: run.createdBy,
        }], { session });
        strategyDoc = createdStrategy;
        await IntelCampaign.updateOne(
          { campaignId: campaign.campaignId, tenantId: input.tenantId },
          {
            $set: {
              currentStrategyVersion: nextStrategyVersion,
              status: run.runType === "strategy" ? "strategy_ready" : "generating",
            },
          },
          { session }
        );
        await publishDomainServiceEvent({
        ctx,
        session,
        eventType: EVENT_TYPES_CI.STRATEGY_GENERATED,
        aggregateType: "intel_campaign",
        aggregateId: campaign.campaignId,
        payload: {
          campaignId: campaign.campaignId,
          strategyVersionId: createdStrategy.strategyVersionId,
          version: createdStrategy.version,
          generationRunId: input.generationRunId,
        },
        idempotencyKey: `ci:strategy:${input.generationRunId}:${createdStrategy.strategyVersionId}`,
        });
        });
      }

      if (existingStrategy) {
        await publishDomainServiceEvent({
          ctx,
          eventType: EVENT_TYPES_CI.STRATEGY_GENERATED,
          aggregateType: "intel_campaign",
          aggregateId: campaign.campaignId,
          payload: {
            campaignId: campaign.campaignId,
            strategyVersionId: existingStrategy.strategyVersionId,
            version: existingStrategy.version,
            generationRunId: input.generationRunId,
          },
          idempotencyKey: `ci:strategy:${input.generationRunId}:${existingStrategy.strategyVersionId}`,
        });
      }
    }

    if (run.runType === "strategy") {
      await atomicFinalization(async (session) => finalizeRun(input, run, campaign.campaignId, {
      strategyVersionId: strategyDoc?.strategyVersionId,
      tokenUsage,
      estimatedCost,
      actualCost,
      costCurrency,
      model: providerModel,
      status: "ready",
      }, session));
    campaignIntelMetrics.success(Date.now() - pipelineStartedAt, "strategy");
    await recordCampaignAnalytics({
      tenantId: input.tenantId,
      eventName: "campaign_strategy_completed",
      campaignId: campaign.campaignId,
      properties: {
        strategyVersionId: strategyDoc?.strategyVersionId,
        generationRunId: input.generationRunId,
      },
    });
    campaignIntelMetrics.active(-1);
    return { ok: true, runType: "strategy", strategyVersionId: strategyDoc?.strategyVersionId };
    }

    // Package + assets
    await ensureNotCancelled();
    await checkpoint(input.generationRunId, input.tenantId, "generate_source_language_assets", { pct: 55 });

    if (!strategyDoc) {
      strategyDoc = await CampaignStrategyVersion.findOne({
        tenantId: input.tenantId,
        campaignId: campaign.campaignId,
      }).sort({ version: -1 });
      if (!strategyDoc) throw new JobPermanentError("Strategy version required before package generation");
    }

    const languages = (run.requestedLanguages?.length
      ? run.requestedLanguages
      : campaign.requestedLanguages) as CampaignLanguage[];
    const channels = (run.requestedChannels?.length
      ? run.requestedChannels
      : campaign.requestedChannels) as Channel[];
    const variants = ((run.inputSnapshot?.variants as string[]) ?? ["balanced"]).slice(0, 3);
    const primary = campaign.primaryLanguage as CampaignLanguage;

    const nextPkgVersion = (campaign.currentPackageVersion ?? 0) + 1;
    const existingPkg = await CampaignPackageVersion.findOne({
      tenantId: input.tenantId,
      campaignId: campaign.campaignId,
      generatedByJobId: input.jobId,
    });
    if (existingPkg) {
      packageDoc = existingPkg;
    } else {
      packageDoc = await CampaignPackageVersion.create({
        packageVersionId: generatePublicId("packageVersion"),
        campaignId: campaign.campaignId,
        tenantId: input.tenantId,
        appKey: campaign.appKey,
        strategyVersionId: strategyDoc.strategyVersionId,
        version: nextPkgVersion,
        status: "generating",
        languages,
        channels,
        assets: [],
        generationSummary: {},
        modelMetadata: { provider: provider.name },
        promptVersion: "pipeline-v1",
        generatedByJobId: input.jobId,
        validationResults: {},
        createdBy: run.createdBy,
      });
    }

    const existingAssets = await CampaignAsset.find({
      tenantId: input.tenantId,
      packageVersionId: packageDoc.packageVersionId,
    }).lean();
    const existingKeys = new Set(
      existingAssets.map((a) => `${a.language}:${a.channel}:${a.variant}:${a.assetType}`)
    );

    const validationResults: Record<string, unknown> = {};
    let failedValidations = 0;

    for (const channel of channels) {
      for (const variant of variants) {
        await ensureNotCancelled();
        const assetType = channelDefaultAssetType(channel);
        const sourceKey = `${primary}:${channel}:${variant}:${assetType}`;

        let sourceContent;
        if (!existingKeys.has(sourceKey)) {
          const gen = contentOutputSchema.parse(await provider.generateAsset({
            signal: input.signal,
            campaign: campaign.toObject() as unknown as Record<string, unknown>,
            strategy: strategyDoc.toObject() as unknown as Record<string, unknown>,
            brand: brand ? (brand.toObject() as unknown as Record<string, unknown>) : null,
            language: primary,
            locale: localeForLanguage(primary),
            channel,
            assetType,
            variant,
            sourceLanguage: primary,
          }));
          addUsage(gen.usage);
          sourceContent = gen.content;

          const det = validateAssetDeterministic({
            content: sourceContent,
            language: primary,
            channel,
            assetType,
            forbiddenPhrases: brand?.forbiddenPhrases,
            mandatoryStatements: Array.isArray(brand?.legalDisclaimers)
              ? brand!.legalDisclaimers.filter((x): x is string => typeof x === "string")
              : undefined,
          });
          const quality = qualityOutputSchema.parse(await provider.evaluateQuality({
            signal: input.signal,
            content: sourceContent,
            language: primary,
            channel,
            brand: brand ? (brand.toObject() as unknown as Record<string, unknown>) : null,
          }));
          addUsage(quality.usage);
          const compliance = complianceOutputSchema.parse(await provider.evaluateCompliance({
            signal: input.signal,
            content: sourceContent,
            brand: brand ? (brand.toObject() as unknown as Record<string, unknown>) : null,
            language: primary,
            channel,
          }));
          addUsage(compliance.usage);

          const validationStatus =
            det.ok && compliance.passed ? "passed" : "failed";
          if (validationStatus === "failed") failedValidations += 1;

          const assetId = generatePublicId("campaignAsset");
          await CampaignAsset.create({
            assetId,
            campaignId: campaign.campaignId,
            tenantId: input.tenantId,
            appKey: campaign.appKey,
            packageVersionId: packageDoc.packageVersionId,
            strategyVersionId: strategyDoc.strategyVersionId,
            language: primary,
            locale: localeForLanguage(primary),
            channel,
            assetType,
            variant,
            ...sourceContent,
            sourceLanguage: primary,
            localizationMethod: "generated_direct",
            qualityScore: quality.qualityScore,
            validationStatus,
            validationErrors: [...det.errors, ...compliance.errors],
            metadata: {
              textDirection: textDirection(primary),
              qualityScores: quality.scores,
            },
          });
          createdAssetIds.push(assetId);
          existingKeys.add(sourceKey);
          validationResults[sourceKey] = { validationStatus, errors: [...det.errors, ...compliance.errors] };
          await publishDomainServiceEvent({
            ctx,
            eventType: EVENT_TYPES_CI.ASSET_GENERATED,
            aggregateType: "intel_campaign",
            aggregateId: campaign.campaignId,
            payload: {
              campaignId: campaign.campaignId,
              generationRunId: input.generationRunId,
              strategyVersionId: strategyDoc.strategyVersionId,
              packageVersionId: packageDoc.packageVersionId,
              jobId: input.jobId,
              assetId,
              language: primary,
              channel,
              status: validationStatus,
            },
            idempotencyKey: `ci:asset:${assetId}`,
          }).catch(() => undefined);
        }

        // Localize to other languages
        for (const lang of languages) {
          if (lang === primary) continue;
          const locKey = `${lang}:${channel}:${variant}:${assetType}`;
          if (existingKeys.has(locKey)) continue;

          const sourceAsset = await CampaignAsset.findOne({
            tenantId: input.tenantId,
            packageVersionId: packageDoc.packageVersionId,
            language: primary,
            channel,
            variant,
            assetType,
          });
          if (!sourceAsset) continue;

          const loc = localizationOutputSchema.parse(await provider.localize({
            signal: input.signal,
            sourceLanguage: primary,
            targetLanguage: lang,
            targetLocale: localeForLanguage(lang),
            content: {
              title: sourceAsset.title,
              hook: sourceAsset.hook,
              body: sourceAsset.body,
              callToAction: sourceAsset.callToAction,
              description: sourceAsset.description,
              hashtags: sourceAsset.hashtags,
              keywords: sourceAsset.keywords,
              script: sourceAsset.script,
              captions: sourceAsset.captions,
            },
            brand: brand ? (brand.toObject() as unknown as Record<string, unknown>) : null,
            channel,
            assetType,
          }));
          addUsage(loc.usage);

          const det = validateAssetDeterministic({
            content: loc.content,
            language: lang,
            channel,
            assetType,
            forbiddenPhrases: brand?.forbiddenPhrases,
            mandatoryStatements: Array.isArray(brand?.legalDisclaimers)
              ? brand.legalDisclaimers.filter((x): x is string => typeof x === "string")
              : undefined,
          });
          const quality = qualityOutputSchema.parse(await provider.evaluateQuality({
            signal: input.signal,
            content: loc.content,
            language: lang,
            channel,
            brand: brand ? (brand.toObject() as unknown as Record<string, unknown>) : null,
          }));
          addUsage(quality.usage);
          const compliance = complianceOutputSchema.parse(await provider.evaluateCompliance({
            signal: input.signal,
            content: loc.content,
            brand: brand ? (brand.toObject() as unknown as Record<string, unknown>) : null,
            language: lang,
            channel,
          }));
          addUsage(compliance.usage);
          const validationStatus = det.ok && compliance.passed ? "passed" : "failed";
          const validationErrors = [...det.errors, ...compliance.errors];
          if (validationStatus === "failed") failedValidations += 1;

          const assetId = generatePublicId("campaignAsset");
          await CampaignAsset.create({
            assetId,
            campaignId: campaign.campaignId,
            tenantId: input.tenantId,
            appKey: campaign.appKey,
            packageVersionId: packageDoc.packageVersionId,
            strategyVersionId: strategyDoc.strategyVersionId,
            language: lang,
            locale: localeForLanguage(lang),
            channel,
            assetType,
            variant,
            ...loc.content,
            sourceLanguage: primary,
            localizationMethod: loc.localizationMethod,
            qualityScore: quality.qualityScore,
            validationStatus,
            validationErrors,
            metadata: { textDirection: textDirection(lang), qualityScores: quality.scores },
          });
          createdAssetIds.push(assetId);
          existingKeys.add(locKey);
          validationResults[locKey] = { validationStatus, errors: validationErrors };
          await publishDomainServiceEvent({
            ctx,
            eventType: EVENT_TYPES_CI.ASSET_GENERATED,
            aggregateType: "intel_campaign",
            aggregateId: campaign.campaignId,
            payload: {
              campaignId: campaign.campaignId,
              generationRunId: input.generationRunId,
              strategyVersionId: strategyDoc.strategyVersionId,
              packageVersionId: packageDoc.packageVersionId,
              jobId: input.jobId,
              assetId,
              language: lang,
              channel,
              status: validationStatus,
            },
            idempotencyKey: `ci:asset:${assetId}`,
          }).catch(() => undefined);
        }
      }
    }

    await checkpoint(input.generationRunId, input.tenantId, "persist_package_version", { pct: 90 });

    const assetsSummary = await CampaignAsset.find({
      tenantId: input.tenantId,
      packageVersionId: packageDoc.packageVersionId,
    })
      .select({ assetId: 1, language: 1, channel: 1, variant: 1, assetType: 1 })
      .lean();

    const packageStatus = failedValidations === 0
      ? "ready"
      : failedValidations >= assetsSummary.length
        ? "validation_failed"
        : "partially_ready";
    const campaignStatus = packageStatus === "validation_failed" ? "failed" : packageStatus;

    await atomicFinalization(async (session) => {
      const finalizedPackage = await CampaignPackageVersion.updateOne(
        { _id: packageDoc!._id, status: "generating" },
        { $set: {
          status: packageStatus,
          assets: assetsSummary,
          validationResults,
          generationSummary: { assetCount: assetsSummary.length, failedValidations, languages, channels },
        } },
        { session }
      );
      if (finalizedPackage.modifiedCount !== 1) throw new JobPermanentError("Package version was already finalized");
      await IntelCampaign.updateOne(
        { campaignId: campaign.campaignId, tenantId: input.tenantId },
        { $set: { currentPackageVersion: packageDoc!.version, status: campaignStatus, generationStatus: "completed" } },
        { session }
      );
      await finalizeRun(input, run, campaign.campaignId, {
        strategyVersionId: strategyDoc!.strategyVersionId,
        packageVersionId: packageDoc!.packageVersionId,
        tokenUsage, estimatedCost, actualCost, costCurrency, model: providerModel,
        status: campaignStatus, assetCount: assetsSummary.length,
      }, session);
      await publishDomainServiceEvent({
        ctx, session,
        eventType: EVENT_TYPES_CI.PACKAGE_GENERATED,
        aggregateType: "intel_campaign",
        aggregateId: campaign.campaignId,
        payload: {
          campaignId: campaign.campaignId,
          packageVersionId: packageDoc!.packageVersionId,
          strategyVersionId: strategyDoc!.strategyVersionId,
          generationRunId: input.generationRunId,
          assetCount: assetsSummary.length,
          status: packageStatus,
        },
        idempotencyKey: `ci:package:${input.generationRunId}:${packageDoc!.packageVersionId}`,
      });
    });

    if (failedValidations > 0) {
      await publishDomainServiceEvent({
        ctx,
        eventType: EVENT_TYPES_CI.VALIDATION_FAILED,
        aggregateType: "intel_campaign",
        aggregateId: campaign.campaignId,
        payload: {
          campaignId: campaign.campaignId,
          generationRunId: input.generationRunId,
          strategyVersionId: strategyDoc.strategyVersionId,
          packageVersionId: packageDoc.packageVersionId,
          jobId: input.jobId,
          status: packageStatus,
          assetCount: failedValidations,
        },
        idempotencyKey: `ci:validation:${input.generationRunId}:${packageDoc.packageVersionId}`,
      }).catch(() => undefined);
    }

    await invalidateCampaignDetailCache(input.tenantId, campaign.campaignId);

    campaignIntelMetrics.success(Date.now() - pipelineStartedAt, "package");
    campaignIntelMetrics.assets(assetsSummary.length);
    if (failedValidations > 0) campaignIntelMetrics.validationFailure(failedValidations);
    campaignIntelMetrics.tokens(tokenUsage.totalTokens);

    await recordCampaignAnalytics({
      tenantId: input.tenantId,
      eventName: "campaign_package_completed",
      campaignId: campaign.campaignId,
      properties: {
        packageVersionId: packageDoc.packageVersionId,
        strategyVersionId: strategyDoc.strategyVersionId,
        generationRunId: input.generationRunId,
        assetCount: assetsSummary.length,
        languageCount: languages.length,
        channelCount: channels.length,
        status: packageStatus,
        provider: provider.name,
        tokenUsage: tokenUsage.totalTokens,
        estimatedCost,
        actualCost,
        costCurrency,
      },
    });
    await recordCampaignAnalytics({
      tenantId: input.tenantId,
      eventName: "campaign_asset_generated",
      campaignId: campaign.campaignId,
      properties: { generationRunId: input.generationRunId, assetCount: assetsSummary.length },
    });
    for (const language of languages) {
      await recordCampaignAnalytics({
        tenantId: input.tenantId,
        eventName: "campaign_language_generated",
        campaignId: campaign.campaignId,
        properties: { generationRunId: input.generationRunId, language },
      });
    }
    for (const channel of channels) {
      await recordCampaignAnalytics({
        tenantId: input.tenantId,
        eventName: "campaign_channel_generated",
        campaignId: campaign.campaignId,
        properties: { generationRunId: input.generationRunId, channel },
      });
    }
    if (failedValidations > 0) {
      await recordCampaignAnalytics({
        tenantId: input.tenantId,
        eventName: "campaign_validation_failed",
        campaignId: campaign.campaignId,
        properties: {
          generationRunId: input.generationRunId,
          failedAssetCount: failedValidations,
          status: packageStatus,
        },
      });
    }

    logger.info("campaign.intel.pipeline.completed", {
      tenantId: input.tenantId,
      campaignId: campaign.campaignId,
      generationRunId: input.generationRunId,
      jobId: input.jobId,
      correlationId: input.correlationId,
      status: packageStatus,
        assetCount: assetsSummary.length,
        durationMs: Date.now() - pipelineStartedAt,
    });

    campaignIntelMetrics.active(-1);
    return {
      ok: true,
      packageVersionId: packageDoc.packageVersionId,
      strategyVersionId: strategyDoc.strategyVersionId,
      assetCount: assetsSummary.length,
      status: packageStatus,
    };
  } catch (err) {
    if (err instanceof JobCancelledError || err instanceof ProviderCancelledError) {
      campaignIntelMetrics.cancel();
      await GenerationRun.updateOne(
        { generationRunId: input.generationRunId, tenantId: input.tenantId },
        { $set: { status: "cancelled", completedAt: new Date() } }
      );
      await IntelCampaign.updateOne(
        { campaignId: input.campaignId, tenantId: input.tenantId },
        { $set: { generationStatus: "cancelled", status: "paused" } }
      );
      await publishDomainServiceEvent({
        ctx,
        eventType: EVENT_TYPES_CI.GENERATION_CANCELLED,
        aggregateType: "intel_campaign",
        aggregateId: input.campaignId,
        payload: {
          campaignId: input.campaignId,
          generationRunId: input.generationRunId,
          jobId: input.jobId,
        },
        idempotencyKey: `ci:cancelled:${input.generationRunId}`,
      }).catch(() => undefined);
      campaignIntelMetrics.active(-1);
      throw err;
    }

    const msg = err instanceof Error ? err.message : String(err);
    const retryable =
      err instanceof JobRetryableError ||
      err instanceof ProviderRetryableError ||
      /timeout|ECONN|temporar|rate.?limit|unavailable/i.test(msg);

    campaignIntelMetrics.failure();
    if (err instanceof ProviderRetryableError || /provider/i.test(msg)) {
      campaignIntelMetrics.providerError();
    }
    if (retryable) campaignIntelMetrics.retry();

    await GenerationRun.updateOne(
      { generationRunId: input.generationRunId, tenantId: input.tenantId },
      {
        $set: {
          status: "failed",
          failedAt: new Date(),
        error: { message: msg.slice(0, 1000), retryable, category: err instanceof Error ? err.name : "Error" },
        },
      }
    );
    await IntelCampaign.updateOne(
      { campaignId: input.campaignId, tenantId: input.tenantId },
      { $set: { generationStatus: "failed", status: "failed" } }
    );

    await publishDomainServiceEvent({
      ctx,
      eventType: EVENT_TYPES_CI.GENERATION_FAILED,
      aggregateType: "intel_campaign",
      aggregateId: input.campaignId,
      payload: {
        campaignId: input.campaignId,
        generationRunId: input.generationRunId,
        errorCategory: retryable ? "retryable" : "permanent",
        jobId: input.jobId,
      },
      idempotencyKey: `ci:fail:${input.generationRunId}:${msg.slice(0, 40)}`,
    }).catch(() => undefined);

    await recordCampaignAnalytics({
      tenantId: input.tenantId,
      eventName: "campaign_generation_failed",
      campaignId: input.campaignId,
      properties: {
        generationRunId: input.generationRunId,
        failureCategory: retryable ? "retryable" : "permanent",
      },
    });

    campaignIntelMetrics.active(-1);
    if (retryable) throw new JobRetryableError(msg);
    throw err instanceof JobPermanentError ? err : new JobPermanentError(msg);
  }
}

async function finalizeRun(
  input: { generationRunId: string; tenantId: string; campaignId: string },
  _run: InstanceType<typeof GenerationRun>,
  campaignId: string,
  summary: Record<string, unknown>,
  session?: ClientSession
) {
  await GenerationRun.updateOne(
    { generationRunId: input.generationRunId, tenantId: input.tenantId },
    {
      $set: {
        status: "completed",
        completedAt: new Date(),
        currentStep: "finalize_generation_run",
        progress: { pct: 100 },
        outputSummary: summary,
        tokenUsage: summary.tokenUsage,
        estimatedCost: toMoneyDecimal(String(summary.estimatedCost ?? "0")),
        actualCost: toMoneyDecimal(String(summary.actualCost ?? "0")),
        provider: getCampaignIntelligenceProvider().name,
        model: typeof summary.model === "string" ? summary.model : undefined,
      },
    },
    { session }
  );
  await IntelCampaign.updateOne(
    { campaignId, tenantId: input.tenantId },
    { $set: { generationStatus: "completed" } },
    { session }
  );
  void _run;
}
