/**
 * Intel campaign CRUD — distinct from challenge/reward Campaign (cmp_).
 */

import { IntelCampaign } from "../models/IntelCampaign";
import { CampaignStrategyVersion } from "../models/CampaignStrategyVersion";
import { CampaignPackageVersion } from "../models/CampaignPackageVersion";
import { CampaignAsset } from "../models/CampaignAsset";
import { campaignBriefSchema, updateIntelCampaignSchema } from "../validation/schemas";
import {
  getCachedCampaignDetail,
  setCachedCampaignDetail,
  invalidateCampaignDetailCache,
} from "./cacheService";
import { writeDomainAudit } from "../../domain/services/domainAudit";
import { NotFoundError, ValidationError } from "../../domain/services/errors";
import type { ActorContext } from "../../domain/services/serviceTypes";
import { snapshotDoc } from "../../domain/services/serviceTypes";
import { paginationSchema } from "../../domain/validation/schemas";
import { publishDomainServiceEvent } from "../../domain/services/publishDomainEvent";
import { EVENT_TYPES_CI } from "../events";
import { recordCampaignAnalytics } from "./analyticsBridge";
import { BrandProfile } from "../models/BrandProfile";
import { AudienceProfile } from "../models/AudienceProfile";

function normalizeCountryCodes(codes: string[]): string[] {
  return codes
    .map((c) => c.trim().toUpperCase())
    .map((c) => (c.length === 2 ? c : c.slice(0, 2)))
    .filter((c) => /^[A-Z]{2}$/.test(c));
}

export const intelCampaignService = {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    const page = paginationSchema.parse(query);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (typeof query.status === "string") filter.status = query.status;
    const [items, total] = await Promise.all([
      IntelCampaign.find(filter)
        .sort({ createdAt: -1 })
        .skip((page.page - 1) * page.limit)
        .limit(page.limit),
      IntelCampaign.countDocuments(filter),
    ]);
    return { items, page: page.page, limit: page.limit, total, hasMore: page.page * page.limit < total };
  },

  async get(ctx: ActorContext, campaignId: string) {
    const cached = await getCachedCampaignDetail(ctx.tenantId, campaignId);
    if (cached) return cached;

    const doc = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId });
    if (!doc) throw new NotFoundError("IntelCampaign", campaignId);

    const [strategies, packages, assets] = await Promise.all([
      CampaignStrategyVersion.find({ tenantId: ctx.tenantId, campaignId })
        .sort({ version: -1 })
        .limit(20)
        .lean(),
      CampaignPackageVersion.find({ tenantId: ctx.tenantId, campaignId })
        .sort({ version: -1 })
        .limit(20)
        .lean(),
      CampaignAsset.find({ tenantId: ctx.tenantId, campaignId })
        .sort({ createdAt: -1 })
        .limit(200)
        .select({
          assetId: 1,
          language: 1,
          locale: 1,
          channel: 1,
          assetType: 1,
          variant: 1,
          packageVersionId: 1,
          validationStatus: 1,
          qualityScore: 1,
          localizationMethod: 1,
          metadata: 1,
          createdAt: 1,
        })
        .lean(),
    ]);

    const payload = {
      ...doc.toObject(),
      strategies,
      packages,
      assets,
    };
    await setCachedCampaignDetail(ctx.tenantId, campaignId, payload as Record<string, unknown>);
    return payload;
  },

  async create(ctx: ActorContext, raw: unknown) {
    const brief = campaignBriefSchema.parse(raw);

    if (brief.brandProfileId) {
      const bp = await BrandProfile.findOne({
        brandProfileId: brief.brandProfileId,
        tenantId: ctx.tenantId,
        active: true,
      });
      if (!bp) throw new ValidationError(`Unknown brandProfileId: ${brief.brandProfileId}`);
    }
    if (brief.audienceProfileId) {
      const ap = await AudienceProfile.findOne({
        audienceProfileId: brief.audienceProfileId,
        tenantId: ctx.tenantId,
        active: true,
      });
      if (!ap) throw new ValidationError(`Unknown audienceProfileId: ${brief.audienceProfileId}`);
    }

    const createPayload: Record<string, unknown> = {
      tenantId: ctx.tenantId,
      appKey: "admin",
      name: brief.name,
      internalDescription: brief.internalDescription,
      objective: brief.campaignObjective,
      status: "draft",
      sourceType: brief.sourceType,
      productOrService: brief.productOrService,
      brandProfileId: brief.brandProfileId,
      audienceProfileId: brief.audienceProfileId,
      offer: brief.offer,
      funnelStage: brief.funnelStage,
      primaryLanguage: brief.primaryLanguage,
      requestedLanguages: brief.languages,
      requestedChannels: brief.channels,
      campaignStartAt: brief.campaignStartAt ? new Date(brief.campaignStartAt) : undefined,
      campaignEndAt: brief.campaignEndAt ? new Date(brief.campaignEndAt) : undefined,
      timezone: brief.timezone,
      marketCountries: normalizeCountryCodes(brief.targetCountries),
      generationStatus: "idle",
      idempotencyKey: brief.idempotencyKey,
      metadata: {
        ...(brief.metadata ?? {}),
        businessObjective: brief.businessObjective,
        targetAudience: brief.targetAudience,
        desiredTone: brief.desiredTone,
        budgetRange: brief.budgetRange,
        primaryCta: brief.primaryCta,
        productFacts: brief.productFacts,
        proofPoints: brief.proofPoints,
        restrictions: brief.restrictions,
        mandatoryStatements: brief.mandatoryStatements,
        prohibitedStatements: brief.prohibitedStatements,
        competitorReferences: brief.competitorReferences,
        additionalInstructions: brief.additionalInstructions,
        variants: brief.variants,
        locales: brief.locales,
      },
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    };

    let doc;
    try {
      doc = await IntelCampaign.create(createPayload);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000) {
        if (brief.idempotencyKey) {
          const existing = await IntelCampaign.findOne({
            tenantId: ctx.tenantId,
            idempotencyKey: brief.idempotencyKey,
          });
          if (existing) return existing;
        }
      }
      throw err;
    }

    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "IntelCampaign",
      entityId: doc.campaignId,
      action: "campaigns.create",
      after: snapshotDoc(doc, ["campaignId", "name", "status", "objective", "funnelStage"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await publishDomainServiceEvent({
      ctx,
      eventType: EVENT_TYPES_CI.CAMPAIGN_CREATED,
      aggregateType: "intel_campaign",
      aggregateId: doc.campaignId,
      payload: {
        campaignId: doc.campaignId,
        status: doc.status,
        name: doc.name,
        objective: doc.objective,
        funnelStage: doc.funnelStage,
      },
      idempotencyKey: `ci:created:${doc.campaignId}`,
    }).catch(() => undefined);

    await recordCampaignAnalytics({
      tenantId: ctx.tenantId,
      eventName: "campaign_created",
      campaignId: doc.campaignId,
      properties: {
        objective: doc.objective.slice(0, 64),
        funnelStage: doc.funnelStage,
        languageCount: doc.requestedLanguages.length,
        channelCount: doc.requestedChannels.length,
      },
    });

    return doc;
  },

  async update(ctx: ActorContext, campaignId: string, raw: unknown) {
    const data = updateIntelCampaignSchema.parse(raw);
    const doc = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId });
    if (!doc) throw new NotFoundError("IntelCampaign", campaignId);
    if (doc.status === "archived") throw new ValidationError("Cannot update archived campaign");

    if (data.brandProfileId) {
      const brand = await BrandProfile.findOne({
        tenantId: ctx.tenantId,
        brandProfileId: data.brandProfileId,
        active: true,
      }).select({ brandProfileId: 1 });
      if (!brand) throw new ValidationError(`Unknown brandProfileId: ${data.brandProfileId}`);
    }
    if (data.audienceProfileId) {
      const audience = await AudienceProfile.findOne({
        tenantId: ctx.tenantId,
        audienceProfileId: data.audienceProfileId,
        active: true,
      }).select({ audienceProfileId: 1 });
      if (!audience) throw new ValidationError(`Unknown audienceProfileId: ${data.audienceProfileId}`);
    }
    if (data.requestedLanguages && !data.requestedLanguages.includes(doc.primaryLanguage)) {
      throw new ValidationError("requestedLanguages must include the campaign primaryLanguage");
    }

    const before = snapshotDoc(doc, ["campaignId", "name", "status", "objective", "funnelStage"]);
    if (data.name !== undefined) doc.name = data.name;
    if (data.internalDescription !== undefined) doc.internalDescription = data.internalDescription;
    if (data.objective !== undefined) doc.objective = data.objective;
    if (data.offer !== undefined) doc.offer = data.offer;
    if (data.funnelStage !== undefined) doc.funnelStage = data.funnelStage;
    if (data.brandProfileId !== undefined) doc.brandProfileId = data.brandProfileId ?? undefined;
    if (data.audienceProfileId !== undefined) doc.audienceProfileId = data.audienceProfileId ?? undefined;
    if (data.requestedLanguages) doc.requestedLanguages = data.requestedLanguages;
    if (data.requestedChannels) doc.requestedChannels = data.requestedChannels;
    if (data.campaignStartAt !== undefined) {
      doc.campaignStartAt = data.campaignStartAt ? new Date(data.campaignStartAt) : undefined;
    }
    if (data.campaignEndAt !== undefined) {
      doc.campaignEndAt = data.campaignEndAt ? new Date(data.campaignEndAt) : undefined;
    }
    if (data.timezone) doc.timezone = data.timezone;
    if (data.marketCountries) doc.marketCountries = normalizeCountryCodes(data.marketCountries);
    if (data.metadata) doc.metadata = { ...(doc.metadata ?? {}), ...data.metadata };
    doc.updatedBy = ctx.actorId;
    await doc.save();

    await invalidateCampaignDetailCache(ctx.tenantId, campaignId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "IntelCampaign",
      entityId: campaignId,
      action: "campaigns.update",
      before,
      after: snapshotDoc(doc, ["campaignId", "name", "status", "objective", "funnelStage"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    await publishDomainServiceEvent({
      ctx,
      eventType: EVENT_TYPES_CI.CAMPAIGN_UPDATED,
      aggregateType: "intel_campaign",
      aggregateId: campaignId,
      payload: { campaignId, status: doc.status, name: doc.name },
      idempotencyKey: `ci:updated:${campaignId}:${doc.updatedAt?.getTime?.() ?? Date.now()}`,
    }).catch(() => undefined);
    return doc;
  },

  async archive(ctx: ActorContext, campaignId: string) {
    const doc = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId });
    if (!doc) throw new NotFoundError("IntelCampaign", campaignId);
    doc.status = "archived";
    doc.archivedAt = new Date();
    doc.archivedBy = ctx.actorId;
    doc.updatedBy = ctx.actorId;
    await doc.save();
    await invalidateCampaignDetailCache(ctx.tenantId, campaignId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "IntelCampaign",
      entityId: campaignId,
      action: "campaigns.archive",
      after: { status: "archived" },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    await publishDomainServiceEvent({
      ctx,
      eventType: EVENT_TYPES_CI.CAMPAIGN_ARCHIVED,
      aggregateType: "intel_campaign",
      aggregateId: campaignId,
      payload: { campaignId, status: "archived" },
      idempotencyKey: `ci:archived:${campaignId}`,
    }).catch(() => undefined);
    return doc;
  },

  async listStrategies(ctx: ActorContext, campaignId: string) {
    await this.requireCampaign(ctx, campaignId);
    return CampaignStrategyVersion.find({ tenantId: ctx.tenantId, campaignId }).sort({ version: -1 });
  },

  async getStrategy(ctx: ActorContext, campaignId: string, version: number) {
    await this.requireCampaign(ctx, campaignId);
    const doc = await CampaignStrategyVersion.findOne({
      tenantId: ctx.tenantId,
      campaignId,
      version,
    });
    if (!doc) throw new NotFoundError("CampaignStrategyVersion", `${campaignId}@${version}`);
    return doc;
  },

  async listPackages(ctx: ActorContext, campaignId: string) {
    await this.requireCampaign(ctx, campaignId);
    return CampaignPackageVersion.find({ tenantId: ctx.tenantId, campaignId }).sort({ version: -1 });
  },

  async getPackage(ctx: ActorContext, campaignId: string, version: number) {
    await this.requireCampaign(ctx, campaignId);
    const doc = await CampaignPackageVersion.findOne({
      tenantId: ctx.tenantId,
      campaignId,
      version,
    });
    if (!doc) throw new NotFoundError("CampaignPackageVersion", `${campaignId}@${version}`);
    return doc;
  },

  async listAssets(ctx: ActorContext, campaignId: string, query: Record<string, unknown> = {}) {
    await this.requireCampaign(ctx, campaignId);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId, campaignId };
    if (typeof query.packageVersionId === "string") filter.packageVersionId = query.packageVersionId;
    if (typeof query.language === "string") filter.language = query.language;
    if (typeof query.channel === "string") filter.channel = query.channel;
    return CampaignAsset.find(filter).sort({ createdAt: -1 }).limit(500);
  },

  async getAsset(ctx: ActorContext, campaignId: string, assetId: string) {
    await this.requireCampaign(ctx, campaignId);
    const doc = await CampaignAsset.findOne({ tenantId: ctx.tenantId, campaignId, assetId });
    if (!doc) throw new NotFoundError("CampaignAsset", assetId);
    return doc;
  },

  async requireCampaign(ctx: ActorContext, campaignId: string) {
    const doc = await IntelCampaign.findOne({ campaignId, tenantId: ctx.tenantId }).select({
      campaignId: 1,
    });
    if (!doc) throw new NotFoundError("IntelCampaign", campaignId);
    return doc;
  },
};
