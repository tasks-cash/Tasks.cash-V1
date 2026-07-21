/**
 * Idempotent generation enqueue + cancel for Campaign Intelligence.
 */

import { IntelCampaign } from "../models/IntelCampaign";
import { GenerationRun } from "../models/GenerationRun";
import { generateRequestSchema } from "../validation/schemas";
import { getCampaignIntelligenceConfig } from "../config";
import { EVENT_TYPES_CI } from "../events";
import { campaignIntelMetrics } from "../metrics";
import { recordCampaignAnalytics } from "./analyticsBridge";
import { invalidateCampaignDetailCache } from "./cacheService";
import { enqueueNamedJob } from "../../jobs/enqueue";
import { JOB_NAMES } from "../../jobs/contracts/jobTypes";
import { cancelJob } from "../../jobs/processing/jobCancellation";
import { withDistributedLock } from "../../jobs/processing/distributedLock";
import { JobLockError } from "../../jobs/contracts/jobErrors";
import { writeDomainAudit } from "../../domain/services/domainAudit";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../domain/services/errors";
import type { ActorContext } from "../../domain/services/serviceTypes";
import { publishDomainServiceEvent } from "../../domain/services/publishDomainEvent";
import { ProviderNotConfiguredError } from "../providers/types";
import { getCampaignIntelligenceProvider } from "../providers/registry";

export interface GenerationEnqueueResult {
  campaignId: string;
  generationRunId: string;
  jobId: string;
  bullJobId: string;
  status: string;
  statusUrl: string;
  reused: boolean;
}

async function enqueueGeneration(
  ctx: ActorContext,
  campaignId: string,
  raw: unknown,
  defaultRunType: "strategy" | "package" | "regenerate"
): Promise<GenerationEnqueueResult> {
  const cfg = getCampaignIntelligenceConfig();
  if (!cfg.enabled) throw new ValidationError("Campaign Intelligence is disabled");

  try {
    getCampaignIntelligenceProvider();
  } catch (err) {
    if (err instanceof ProviderNotConfiguredError) {
      throw new ValidationError(err.message);
    }
    throw err;
  }

  const body = generateRequestSchema.parse({ ...((raw as object) ?? {}), runType: (raw as { runType?: string })?.runType ?? defaultRunType });
  const campaign = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId });
  if (!campaign) throw new NotFoundError("IntelCampaign", campaignId);
  if (campaign.status === "archived") throw new ValidationError("Cannot generate for archived campaign");

  const languages = body.languages ?? campaign.requestedLanguages;
  const channels = body.channels ?? campaign.requestedChannels;
  if (!channels.length) throw new ValidationError("At least one channel is required");

  // Idempotent reuse
  const existing = await GenerationRun.findOne({
    tenantId: ctx.tenantId,
    idempotencyKey: body.idempotencyKey,
  });
  if (existing) {
    if (existing.campaignId !== campaignId) {
      throw new ConflictError("Idempotency key is already bound to another campaign");
    }
    // Repair a prior Mongo→Bull dispatch interruption using the canonical Jobs
    // Platform reservation. The same idempotency key yields the same identities.
    if (!existing.jobId || !existing.bullJobId) {
      const repaired = await enqueueNamedJob(
        JOB_NAMES.CAMPAIGN_INTELLIGENCE_GENERATE,
        {
          tenantId: ctx.tenantId,
          appKey: "admin",
          actorId: ctx.actorId,
          idempotencyKey: body.idempotencyKey,
          correlationId: body.idempotencyKey,
          payload: { campaignId, generationRunId: existing.generationRunId, runType: existing.runType },
        },
        { jobId: body.idempotencyKey }
      );
      existing.jobId = repaired.jobId;
      existing.bullJobId = repaired.bullJobId;
      existing.status = "queued";
      await existing.save();
    }
    return {
      campaignId,
      generationRunId: existing.generationRunId,
      jobId: existing.jobId || "",
      bullJobId: existing.bullJobId || "",
      status: existing.status,
      statusUrl: `/api/campaigns/${campaignId}/generation-status?generationRunId=${existing.generationRunId}`,
      reused: true,
    };
  }

  const lockName = `campaign-intel-gen:${ctx.tenantId}:${campaignId}`;
  try {
    return await withDistributedLock(lockName, 15_000, async () => {
      const active = await GenerationRun.findOne({
        tenantId: ctx.tenantId,
        campaignId,
        status: { $in: ["queued", "running", "cancelling"] },
      });
      if (active && body.runType !== "regenerate") {
        // Allow regenerate only with new idempotency key after active completes;
        // concurrent conflicting runs are blocked.
        throw new ConflictError(
          `Generation already in progress: ${active.generationRunId}`
        );
      }
      if (active && body.runType === "regenerate") {
        throw new ConflictError(
          `Cannot regenerate while run ${active.generationRunId} is active`
        );
      }

      const run = await GenerationRun.create({
        tenantId: ctx.tenantId,
        appKey: "admin",
        campaignId,
        idempotencyKey: body.idempotencyKey,
        runType: body.runType,
        requestedLanguages: languages,
        requestedChannels: channels,
        status: "queued",
        currentStep: "validate_campaign_brief",
        progress: { pct: 0 },
        attempts: 0,
        inputSnapshot: {
          brief: campaign.metadata ?? {},
          variants: body.variants ?? ["balanced"],
          objective: campaign.objective,
          productOrService: campaign.productOrService,
          offer: campaign.offer,
        },
        correlationId: body.idempotencyKey,
        createdBy: ctx.actorId,
      });

      campaignIntelMetrics.request();

      let enq: { jobId: string; bullJobId: string };
      try {
        enq = await enqueueNamedJob(
          JOB_NAMES.CAMPAIGN_INTELLIGENCE_GENERATE,
          {
            tenantId: ctx.tenantId,
            appKey: "admin",
            actorId: ctx.actorId,
            idempotencyKey: body.idempotencyKey,
            correlationId: body.idempotencyKey,
            payload: {
              campaignId,
              generationRunId: run.generationRunId,
              runType: body.runType,
            },
          },
          { jobId: body.idempotencyKey }
        );
      } catch (err) {
        // Keep the canonical generation run. A repeated request with the same
        // key repairs delivery through enqueueNamedJob's canonical reservation.
        throw err;
      }

      await GenerationRun.updateOne(
        { _id: run._id },
        { $set: { jobId: enq.jobId, bullJobId: enq.bullJobId } }
      );

      await IntelCampaign.updateOne(
        { _id: campaign._id },
        {
          $set: {
            generationStatus: "queued",
            lastGenerationJobId: enq.jobId,
            status: body.runType === "strategy" ? "analyzing" : "generating",
          },
        }
      );

      await invalidateCampaignDetailCache(ctx.tenantId, campaignId);

      const eventType =
        body.runType === "strategy"
          ? EVENT_TYPES_CI.STRATEGY_GENERATION_REQUESTED
          : EVENT_TYPES_CI.PACKAGE_GENERATION_REQUESTED;

      await publishDomainServiceEvent({
        ctx,
        eventType,
        aggregateType: "intel_campaign",
        aggregateId: campaignId,
        payload: {
          campaignId,
          generationRunId: run.generationRunId,
          jobId: enq.jobId,
          runType: body.runType,
        },
        idempotencyKey: `ci:gen-req:${body.idempotencyKey}`,
      }).catch(() => undefined);

      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "IntelCampaign",
        entityId: campaignId,
        action: "campaigns.generate",
        after: {
          generationRunId: run.generationRunId,
          jobId: enq.jobId,
          runType: body.runType,
        },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { correlationId: body.idempotencyKey },
      });

      await recordCampaignAnalytics({
        tenantId: ctx.tenantId,
        eventName: "campaign_generation_requested",
        campaignId,
        properties: {
          runType: body.runType,
          languageCount: languages.length,
          channelCount: channels.length,
        },
      });

      return {
        campaignId,
        generationRunId: run.generationRunId,
        jobId: enq.jobId,
        bullJobId: enq.bullJobId,
        status: "queued",
        statusUrl: `/api/campaigns/${campaignId}/generation-status?generationRunId=${run.generationRunId}`,
        reused: false,
      };
    });
  } catch (err) {
    if (err instanceof JobLockError) {
      throw new ConflictError("Could not acquire generation lock; retry shortly");
    }
    throw err;
  }
}

export const generationService = {
  generateStrategy(ctx: ActorContext, campaignId: string, raw: unknown) {
    return enqueueGeneration(ctx, campaignId, raw, "strategy");
  },
  generatePackage(ctx: ActorContext, campaignId: string, raw: unknown) {
    return enqueueGeneration(ctx, campaignId, raw, "package");
  },
  regenerate(ctx: ActorContext, campaignId: string, raw: unknown) {
    return enqueueGeneration(ctx, campaignId, { ...(raw as object), runType: "regenerate" }, "regenerate");
  },

  async cancel(ctx: ActorContext, campaignId: string) {
    const campaign = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId });
    if (!campaign) throw new NotFoundError("IntelCampaign", campaignId);

    const run = await GenerationRun.findOne({
      tenantId: ctx.tenantId,
      campaignId,
      status: { $in: ["queued", "running", "cancelling"] },
    }).sort({ createdAt: -1 });

    if (!run) throw new ValidationError("No active generation run to cancel");

    const cancellation = await GenerationRun.updateOne(
      { _id: run._id, status: { $in: ["queued", "running"] } },
      {
        $set: {
          cancellationRequestedAt: new Date(),
          status: "cancelling",
        },
      }
    );

    if (cancellation.modifiedCount === 0 && run.status !== "cancelling") {
      throw new ConflictError("Generation is no longer cancellable");
    }

    if (run.jobId) {
      await cancelJob({
        jobId: run.jobId,
        tenantId: ctx.tenantId,
        reason: "user_cancel",
        cancelledBy: ctx.actorId,
        queueName: "ai",
        bullJobId: run.bullJobId,
      });
    }

    // A queued job can be removed before a worker ever observes the cancellation.
    // Finalize it here atomically; running jobs remain cooperative and the worker
    // performs the same terminal transition at its next checkpoint.
    let responseStatus = "cancelling";
    if (run.status === "queued") {
      const finalized = await GenerationRun.updateOne(
        { _id: run._id, status: "cancelling" },
        { $set: { status: "cancelled", completedAt: new Date() } }
      );
      if (finalized.modifiedCount === 1) {
        responseStatus = "cancelled";
        await IntelCampaign.updateOne(
          { _id: campaign._id, tenantId: ctx.tenantId },
          { $set: { generationStatus: "cancelled", status: "paused" } }
        );
        await publishDomainServiceEvent({
          ctx,
          eventType: EVENT_TYPES_CI.GENERATION_CANCELLED,
          aggregateType: "intel_campaign",
          aggregateId: campaignId,
          payload: { campaignId, generationRunId: run.generationRunId, jobId: run.jobId },
          idempotencyKey: `ci:cancelled:${run.generationRunId}`,
        });
      }
    }

    campaignIntelMetrics.cancel();

    await publishDomainServiceEvent({
      ctx,
      eventType: EVENT_TYPES_CI.GENERATION_CANCEL_REQUESTED,
      aggregateType: "intel_campaign",
      aggregateId: campaignId,
      payload: {
        campaignId,
        generationRunId: run.generationRunId,
        jobId: run.jobId,
      },
      idempotencyKey: `ci:cancel:${run.generationRunId}`,
    }).catch(() => undefined);

    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "IntelCampaign",
      entityId: campaignId,
      action: "campaigns.cancel_generation",
      after: { generationRunId: run.generationRunId },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await recordCampaignAnalytics({
      tenantId: ctx.tenantId,
      eventName: "campaign_generation_cancelled",
      campaignId,
      properties: { generationRunId: run.generationRunId },
    });

    return {
      campaignId,
      generationRunId: run.generationRunId,
      status: responseStatus,
    };
  },

  async getStatus(ctx: ActorContext, campaignId: string, generationRunId?: string) {
    const campaign = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId });
    if (!campaign) throw new NotFoundError("IntelCampaign", campaignId);

    const run = generationRunId
      ? await GenerationRun.findOne({ tenantId: ctx.tenantId, campaignId, generationRunId })
      : await GenerationRun.findOne({ tenantId: ctx.tenantId, campaignId }).sort({ createdAt: -1 });

    return {
      campaignId,
      campaignStatus: campaign.status,
      generationStatus: campaign.generationStatus,
      lastGenerationJobId: campaign.lastGenerationJobId,
      currentStrategyVersion: campaign.currentStrategyVersion,
      currentPackageVersion: campaign.currentPackageVersion,
      run: run
        ? {
            generationRunId: run.generationRunId,
            jobId: run.jobId,
            bullJobId: run.bullJobId,
            runType: run.runType,
            status: run.status,
            currentStep: run.currentStep,
            progress: run.progress,
            attempts: run.attempts,
            error: run.error,
            startedAt: run.startedAt,
            completedAt: run.completedAt,
            outputSummary: run.outputSummary,
          }
        : null,
    };
  },

  async listRuns(ctx: ActorContext, campaignId: string) {
    const campaign = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId }).select({
      campaignId: 1,
    });
    if (!campaign) throw new NotFoundError("IntelCampaign", campaignId);
    return GenerationRun.find({ tenantId: ctx.tenantId, campaignId }).sort({ createdAt: -1 }).limit(50);
  },
};
