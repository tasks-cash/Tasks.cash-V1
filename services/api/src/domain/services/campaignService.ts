import { compareMoney, toMoneyDecimal } from "../shared/baseSchema";
import { campaignRepository } from "../repositories";
import type { ICampaign } from "../models/Campaign";
import type { CampaignStatus } from "../shared/lifecycle";
import { createCampaignSchema, updateCampaignSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { ConflictError, ValidationError } from "./errors";
import { ActorContext, moneyString, slugify, snapshotDoc } from "./serviceTypes";
import { logBusinessEvent } from "../../observability/businessEvents";

export class CampaignService {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    return timed({ service: "CampaignService", entity: "Campaign", operation: "list", tenant: ctx.tenantId }, async () => {
      const page = paginationSchema.parse(query);
      const status = typeof query.status === "string" ? query.status : undefined;
      const appKey = typeof query.appKey === "string" ? query.appKey : undefined;
      const filter: Record<string, unknown> = {};
      if (status) filter.status = status;
      if (appKey) filter.appKey = appKey;
      return campaignRepository.list(ctx.tenantId, filter, page);
    });
  }

  async get(ctx: ActorContext, campaignId: string) {
    return timed({ service: "CampaignService", entity: "Campaign", operation: "get", tenant: ctx.tenantId }, async () => {
      return campaignRepository.requireByPublicId(ctx.tenantId, campaignId);
    });
  }

  async create(ctx: ActorContext, raw: unknown) {
    return timed({ service: "CampaignService", entity: "Campaign", operation: "create", tenant: ctx.tenantId }, async () => {
      const data = createCampaignSchema.parse(raw);
      const slug = data.slug || slugify(data.name);
      this.assertBudget(data.budget, data.rewardBudget, "0");
      this.assertDates(data.startAt, data.endAt);

      const existing = await campaignRepository.findBySlug(ctx.tenantId, data.appKey, slug);
      if (existing) throw new ConflictError(`Campaign slug already exists: ${slug}`);

      const doc = await campaignRepository.create(ctx.tenantId, {
        ...data,
        slug,
        budget: toMoneyDecimal(data.budget),
        rewardBudget: toMoneyDecimal(data.rewardBudget),
        spentRewardAmount: toMoneyDecimal("0"),
        createdBy: ctx.actorId,
        updatedBy: ctx.actorId,
      });

      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "Campaign",
        entityId: doc.campaignId,
        action: "campaign.create",
        after: snapshotDoc(doc, ["campaignId", "name", "slug", "status", "budget", "rewardBudget"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      logBusinessEvent("CampaignCreated", {
        entity: "Campaign",
        entityId: doc.campaignId,
        tenantId: ctx.tenantId,
      });
      return doc;
    });
  }

  async update(ctx: ActorContext, campaignId: string, raw: unknown) {
    return timed({ service: "CampaignService", entity: "Campaign", operation: "update", tenant: ctx.tenantId }, async () => {
      const data = updateCampaignSchema.parse(raw);
      const before = await campaignRepository.requireByPublicId(ctx.tenantId, campaignId);
      if (["completed", "cancelled", "archived"].includes(before.status)) {
        throw new ValidationError(`Cannot update campaign in status ${before.status}`);
      }

      if (data.slug && data.slug !== before.slug) {
        const clash = await campaignRepository.findBySlug(ctx.tenantId, data.appKey ?? before.appKey, data.slug);
        if (clash && clash.campaignId !== campaignId) {
          throw new ConflictError(`Campaign slug already exists: ${data.slug}`);
        }
      }

      const budget = data.budget ?? moneyString(before.budget);
      const rewardBudget = data.rewardBudget ?? moneyString(before.rewardBudget);
      this.assertBudget(budget, rewardBudget, moneyString(before.spentRewardAmount));
      this.assertDates(data.startAt ?? before.startAt, data.endAt ?? before.endAt);

      const patch: Record<string, unknown> = { ...data };
      if (data.budget !== undefined) patch.budget = toMoneyDecimal(data.budget);
      if (data.rewardBudget !== undefined) patch.rewardBudget = toMoneyDecimal(data.rewardBudget);

      const after = await campaignRepository.updateByPublicId(ctx.tenantId, campaignId, patch, ctx.actorId);
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "Campaign",
        entityId: campaignId,
        action: "campaign.update",
        before: snapshotDoc(before, ["status", "name", "slug", "budget", "rewardBudget"]),
        after: snapshotDoc(after, ["status", "name", "slug", "budget", "rewardBudget"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return after;
    });
  }

  async archive(ctx: ActorContext, campaignId: string) {
    return this.transition(ctx, campaignId, "archived", "campaign.archive");
  }

  async publish(ctx: ActorContext, campaignId: string) {
    return this.transition(ctx, campaignId, "published", "campaign.publish");
  }

  async schedule(ctx: ActorContext, campaignId: string) {
    return this.transition(ctx, campaignId, "scheduled", "campaign.schedule");
  }

  async pause(ctx: ActorContext, campaignId: string) {
    return this.transition(ctx, campaignId, "paused", "campaign.pause");
  }

  async resume(ctx: ActorContext, campaignId: string) {
    return this.transition(ctx, campaignId, "running", "campaign.resume");
  }

  async complete(ctx: ActorContext, campaignId: string) {
    return this.transition(ctx, campaignId, "completed", "campaign.complete");
  }

  async cancel(ctx: ActorContext, campaignId: string) {
    return this.transition(ctx, campaignId, "cancelled", "campaign.cancel");
  }

  async softDelete(ctx: ActorContext, campaignId: string) {
    return timed({ service: "CampaignService", entity: "Campaign", operation: "softDelete", tenant: ctx.tenantId }, async () => {
      const before = await campaignRepository.requireByPublicId(ctx.tenantId, campaignId);
      const after = await campaignRepository.softDelete(ctx.tenantId, campaignId, ctx.actorId);
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "Campaign",
        entityId: campaignId,
        action: "campaign.delete",
        before: snapshotDoc(before, ["status", "slug"]),
        after: snapshotDoc(after, ["deletedAt", "status"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return after;
    });
  }

  async duplicate(ctx: ActorContext, campaignId: string) {
    return timed({ service: "CampaignService", entity: "Campaign", operation: "duplicate", tenant: ctx.tenantId }, async () => {
      const src = await campaignRepository.requireByPublicId(ctx.tenantId, campaignId);
      const baseSlug = `${src.slug}-copy`;
      let slug = baseSlug;
      let n = 1;
      while (await campaignRepository.findBySlug(ctx.tenantId, src.appKey, slug)) {
        slug = `${baseSlug}-${n++}`;
      }
      const doc = await campaignRepository.create(ctx.tenantId, {
        appKey: src.appKey,
        name: `${src.name} (Copy)`,
        slug,
        description: src.description,
        shortDescription: src.shortDescription,
        campaignType: src.campaignType,
        status: "draft",
        visibility: src.visibility,
        timezone: src.timezone,
        budget: src.budget,
        currency: src.currency,
        rewardBudget: src.rewardBudget,
        spentRewardAmount: toMoneyDecimal("0"),
        participantLimit: src.participantLimit,
        audienceRules: src.audienceRules,
        eligibilityRules: src.eligibilityRules,
        targeting: src.targeting,
        languages: src.languages,
        featuredImage: src.featuredImage,
        bannerImage: src.bannerImage,
        tags: src.tags,
        metadata: src.metadata,
        createdBy: ctx.actorId,
        updatedBy: ctx.actorId,
      });
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "Campaign",
        entityId: doc.campaignId,
        action: "campaign.duplicate",
        metadata: { sourceCampaignId: campaignId },
        after: snapshotDoc(doc, ["campaignId", "slug", "status"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return doc;
    });
  }

  private async transition(ctx: ActorContext, campaignId: string, to: CampaignStatus, action: string) {
    return timed({ service: "CampaignService", entity: "Campaign", operation: to, tenant: ctx.tenantId }, async () => {
      const before = await campaignRepository.requireByPublicId(ctx.tenantId, campaignId);
      if (to === "scheduled" && !before.startAt) {
        throw new ValidationError("Scheduled campaigns require startAt");
      }
      if (to === "published" || to === "running") {
        this.assertBudget(moneyString(before.budget), moneyString(before.rewardBudget), moneyString(before.spentRewardAmount));
      }
      const after = await campaignRepository.transitionStatus(ctx.tenantId, campaignId, to, ctx.actorId);
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "Campaign",
        entityId: campaignId,
        action,
        before: { status: before.status },
        after: { status: after.status },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      if (to === "published") {
        logBusinessEvent("CampaignPublished", {
          entity: "Campaign",
          entityId: campaignId,
          tenantId: ctx.tenantId,
        });
      } else if (to === "paused") {
        logBusinessEvent("CampaignPaused", {
          entity: "Campaign",
          entityId: campaignId,
          tenantId: ctx.tenantId,
        });
      } else if (to === "completed") {
        logBusinessEvent("CampaignCompleted", {
          entity: "Campaign",
          entityId: campaignId,
          tenantId: ctx.tenantId,
        });
      }
      return after;
    });
  }

  private assertBudget(budget: string, rewardBudget: string, spent: string) {
    if (compareMoney(budget, "0") < 0 || compareMoney(rewardBudget, "0") < 0) {
      throw new ValidationError("Budget values must be non-negative");
    }
    if (compareMoney(rewardBudget, budget) > 0) {
      throw new ValidationError("rewardBudget cannot exceed budget");
    }
    if (compareMoney(spent, rewardBudget) > 0) {
      throw new ValidationError("spentRewardAmount cannot exceed rewardBudget");
    }
  }

  private assertDates(startAt?: Date | null, endAt?: Date | null) {
    if (startAt && endAt && endAt <= startAt) {
      throw new ValidationError("endAt must be after startAt");
    }
  }
}

export const campaignService = new CampaignService();

export type { ICampaign };
