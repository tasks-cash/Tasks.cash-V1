/**
 * Brand + Audience profile CRUD for Campaign Intelligence.
 */

import { BrandProfile } from "../models/BrandProfile";
import { AudienceProfile } from "../models/AudienceProfile";
import {
  createBrandProfileSchema,
  updateBrandProfileSchema,
  createAudienceProfileSchema,
  updateAudienceProfileSchema,
} from "../validation/schemas";
import { writeDomainAudit } from "../../domain/services/domainAudit";
import { NotFoundError } from "../../domain/services/errors";
import type { ActorContext } from "../../domain/services/serviceTypes";
import { snapshotDoc } from "../../domain/services/serviceTypes";
import { paginationSchema } from "../../domain/validation/schemas";
import { IntelCampaign } from "../models/IntelCampaign";
import { invalidateCampaignDetailCache } from "./cacheService";

function normalizeCountries(codes: string[] | undefined): string[] {
  return (codes ?? []).map((c) => c.trim().toUpperCase().slice(0, 2)).filter((c) => /^[A-Z]{2}$/.test(c));
}

async function invalidateProfileCampaigns(
  tenantId: string,
  field: "brandProfileId" | "audienceProfileId",
  profileId: string
): Promise<void> {
  const campaigns = await IntelCampaign.find({ tenantId, [field]: profileId })
    .select({ campaignId: 1, _id: 0 })
    .lean();
  await Promise.all(campaigns.map((campaign) =>
    invalidateCampaignDetailCache(tenantId, campaign.campaignId)
  ));
}

export const brandProfileService = {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    const page = paginationSchema.parse(query);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (query.active === "true") filter.active = true;
    if (query.active === "false") filter.active = false;
    const [items, total] = await Promise.all([
      BrandProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip((page.page - 1) * page.limit)
        .limit(page.limit),
      BrandProfile.countDocuments(filter),
    ]);
    return { items, page: page.page, limit: page.limit, total, hasMore: page.page * page.limit < total };
  },

  async get(ctx: ActorContext, brandProfileId: string) {
    const doc = await BrandProfile.findOne({ brandProfileId, tenantId: ctx.tenantId });
    if (!doc) throw new NotFoundError("BrandProfile", brandProfileId);
    return doc;
  },

  async create(ctx: ActorContext, raw: unknown) {
    const data = createBrandProfileSchema.parse(raw);
    const doc = await BrandProfile.create({
      name: data.name,
      companyDescription: data.companyDescription,
      products: data.products,
      services: data.services,
      valuePropositions: data.valuePropositions,
      brandVoice: data.brandVoice ? { summary: data.brandVoice } : undefined,
      toneRules: data.toneRules?.length ? { rules: data.toneRules } : undefined,
      forbiddenPhrases: data.forbiddenPhrases,
      preferredTerminology: data.preferredTerminology,
      legalDisclaimers: data.legalDisclaimers,
      complianceRules: data.complianceRules?.length ? { rules: data.complianceRules } : undefined,
      visualGuidelines: data.visualGuidelines ? { summary: data.visualGuidelines } : undefined,
      targetMarkets: normalizeCountries(data.targetMarkets),
      supportedLanguages: data.supportedLanguages,
      website: data.website || undefined,
      socialProfiles: data.socialProfiles,
      competitorNames: data.competitorNames,
      metadata: data.metadata,
      active: data.active,
      tenantId: ctx.tenantId,
      appKey: "admin",
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    });
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "BrandProfile",
      entityId: doc.brandProfileId,
      action: "campaigns.brand_profile.create",
      after: snapshotDoc(doc, ["brandProfileId", "name", "active", "version"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  },

  async update(ctx: ActorContext, brandProfileId: string, raw: unknown) {
    const data = updateBrandProfileSchema.parse(raw);
    const doc = await this.get(ctx, brandProfileId);
    const before = snapshotDoc(doc, ["brandProfileId", "name", "active", "version"]);
    const patch: Record<string, unknown> = {
      ...data,
      updatedBy: ctx.actorId,
    };
    if (data.targetMarkets) patch.targetMarkets = normalizeCountries(data.targetMarkets);
    if (data.website === "") patch.website = undefined;
    Object.assign(doc, patch);
    await doc.save();
    await invalidateProfileCampaigns(ctx.tenantId, "brandProfileId", brandProfileId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "BrandProfile",
      entityId: brandProfileId,
      action: "campaigns.brand_profile.update",
      before,
      after: snapshotDoc(doc, ["brandProfileId", "name", "active", "version"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  },

  async archive(ctx: ActorContext, brandProfileId: string) {
    const doc = await this.get(ctx, brandProfileId);
    doc.active = false;
    doc.updatedBy = ctx.actorId;
    await doc.save();
    await invalidateProfileCampaigns(ctx.tenantId, "brandProfileId", brandProfileId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "BrandProfile",
      entityId: brandProfileId,
      action: "campaigns.brand_profile.archive",
      after: { active: false },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  },
};

export const audienceProfileService = {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    const page = paginationSchema.parse(query);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (query.active === "true") filter.active = true;
    if (query.active === "false") filter.active = false;
    const [items, total] = await Promise.all([
      AudienceProfile.find(filter)
        .sort({ createdAt: -1 })
        .skip((page.page - 1) * page.limit)
        .limit(page.limit),
      AudienceProfile.countDocuments(filter),
    ]);
    return { items, page: page.page, limit: page.limit, total, hasMore: page.page * page.limit < total };
  },

  async get(ctx: ActorContext, audienceProfileId: string) {
    const doc = await AudienceProfile.findOne({ audienceProfileId, tenantId: ctx.tenantId });
    if (!doc) throw new NotFoundError("AudienceProfile", audienceProfileId);
    return doc;
  },

  async create(ctx: ActorContext, raw: unknown) {
    const data = createAudienceProfileSchema.parse(raw);
    const doc = await AudienceProfile.create({
      ...data,
      tenantId: ctx.tenantId,
      appKey: "admin",
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    });
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "AudienceProfile",
      entityId: doc.audienceProfileId,
      action: "campaigns.audience_profile.create",
      after: snapshotDoc(doc, ["audienceProfileId", "name", "active", "version"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  },

  async update(ctx: ActorContext, audienceProfileId: string, raw: unknown) {
    const data = updateAudienceProfileSchema.parse(raw);
    const doc = await this.get(ctx, audienceProfileId);
    const before = snapshotDoc(doc, ["audienceProfileId", "name", "active", "version"]);
    Object.assign(doc, data, { updatedBy: ctx.actorId });
    await doc.save();
    await invalidateProfileCampaigns(ctx.tenantId, "audienceProfileId", audienceProfileId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "AudienceProfile",
      entityId: audienceProfileId,
      action: "campaigns.audience_profile.update",
      before,
      after: snapshotDoc(doc, ["audienceProfileId", "name", "active", "version"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  },

  async archive(ctx: ActorContext, audienceProfileId: string) {
    const doc = await this.get(ctx, audienceProfileId);
    doc.active = false;
    doc.updatedBy = ctx.actorId;
    await doc.save();
    await invalidateProfileCampaigns(ctx.tenantId, "audienceProfileId", audienceProfileId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "AudienceProfile",
      entityId: audienceProfileId,
      action: "campaigns.audience_profile.archive",
      after: { active: false },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  },
};
