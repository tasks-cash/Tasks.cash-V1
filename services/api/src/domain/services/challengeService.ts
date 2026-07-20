import { challengeRepository, campaignRepository } from "../repositories";
import type { ChallengeStatus } from "../shared/lifecycle";
import { createChallengeSchema, updateChallengeSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { ConflictError, NotFoundError, ValidationError } from "./errors";
import { ActorContext, slugify, snapshotDoc } from "./serviceTypes";

export class ChallengeService {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    return timed({ service: "ChallengeService", entity: "DomainChallenge", operation: "list", tenant: ctx.tenantId }, async () => {
      const page = paginationSchema.parse(query);
      const filter: Record<string, unknown> = {};
      if (typeof query.campaignId === "string") filter.campaignId = query.campaignId;
      if (typeof query.status === "string") filter.status = query.status;
      if (typeof query.appKey === "string") filter.appKey = query.appKey;
      return challengeRepository.list(ctx.tenantId, filter, page);
    });
  }

  async get(ctx: ActorContext, challengeId: string) {
    return challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
  }

  async create(ctx: ActorContext, raw: unknown) {
    return timed({ service: "ChallengeService", entity: "DomainChallenge", operation: "create", tenant: ctx.tenantId }, async () => {
      const data = createChallengeSchema.parse(raw);
      this.assertRules(data);
      this.assertDates(data.startAt, data.endAt);
      if (data.campaignId) {
        await campaignRepository.requireByPublicId(ctx.tenantId, data.campaignId);
      }

      const slug = data.slug || slugify(data.name);
      const doc = await challengeRepository.create(ctx.tenantId, {
        ...data,
        slug,
        createdBy: ctx.actorId,
        updatedBy: ctx.actorId,
      });

      if (data.campaignId) {
        const camp = await campaignRepository.requireByPublicId(ctx.tenantId, data.campaignId);
        if (!camp.challengeIds.includes(doc.challengeId)) {
          camp.challengeIds = [...camp.challengeIds, doc.challengeId];
          camp.updatedBy = ctx.actorId;
          await camp.save();
        }
      }

      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainChallenge",
        entityId: doc.challengeId,
        action: "challenge.create",
        after: snapshotDoc(doc, ["challengeId", "name", "slug", "status", "campaignId", "challengeType"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return doc;
    });
  }

  async update(ctx: ActorContext, challengeId: string, raw: unknown) {
    return timed({ service: "ChallengeService", entity: "DomainChallenge", operation: "update", tenant: ctx.tenantId }, async () => {
      const data = updateChallengeSchema.parse(raw);
      const before = await challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
      if (["completed", "cancelled", "archived"].includes(before.status)) {
        throw new ValidationError(`Cannot update challenge in status ${before.status}`);
      }
      this.assertRules(data);
      this.assertDates(data.startAt ?? before.startAt, data.endAt ?? before.endAt);
      if (data.participantLimit != null && data.participantLimit < before.participationCount) {
        throw new ValidationError("participantLimit cannot be below current participationCount");
      }
      const after = await challengeRepository.updateByPublicId(ctx.tenantId, challengeId, data, ctx.actorId);
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainChallenge",
        entityId: challengeId,
        action: "challenge.update",
        before: snapshotDoc(before, ["status", "name", "slug"]),
        after: snapshotDoc(after, ["status", "name", "slug"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return after;
    });
  }

  async attachToCampaign(ctx: ActorContext, challengeId: string, campaignId: string) {
    return timed({ service: "ChallengeService", entity: "DomainChallenge", operation: "attach", tenant: ctx.tenantId }, async () => {
      const camp = await campaignRepository.requireByPublicId(ctx.tenantId, campaignId);
      const ch = await challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
      const updated = await challengeRepository.updateByPublicId(
        ctx.tenantId,
        challengeId,
        { campaignId },
        ctx.actorId
      );
      if (!camp.challengeIds.includes(challengeId)) {
        camp.challengeIds = [...camp.challengeIds, challengeId];
        camp.updatedBy = ctx.actorId;
        await camp.save();
      }
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainChallenge",
        entityId: challengeId,
        action: "challenge.attach_campaign",
        before: { campaignId: ch.campaignId },
        after: { campaignId },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return updated;
    });
  }

  async activate(ctx: ActorContext, challengeId: string) {
    return this.transition(ctx, challengeId, "active", "challenge.activate");
  }

  async pause(ctx: ActorContext, challengeId: string) {
    return this.transition(ctx, challengeId, "paused", "challenge.pause");
  }

  async archive(ctx: ActorContext, challengeId: string) {
    return this.transition(ctx, challengeId, "archived", "challenge.archive");
  }

  async softDelete(ctx: ActorContext, challengeId: string) {
    const before = await challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
    const after = await challengeRepository.softDelete(ctx.tenantId, challengeId, ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainChallenge",
      entityId: challengeId,
      action: "challenge.delete",
      before: snapshotDoc(before, ["status"]),
      after: { deletedAt: after.deletedAt },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  async duplicate(ctx: ActorContext, challengeId: string) {
    return timed({ service: "ChallengeService", entity: "DomainChallenge", operation: "duplicate", tenant: ctx.tenantId }, async () => {
      const src = await challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
      const doc = await challengeRepository.create(ctx.tenantId, {
        appKey: src.appKey,
        campaignId: src.campaignId,
        templateId: src.templateId,
        name: `${src.name} (Copy)`,
        slug: `${src.slug}-copy-${Date.now().toString(36)}`,
        description: src.description,
        instructions: src.instructions,
        challengeType: src.challengeType,
        status: "draft",
        difficulty: src.difficulty,
        visibility: src.visibility,
        timezone: src.timezone,
        recurrence: src.recurrence,
        cooldown: src.cooldown,
        participationRules: src.participationRules,
        eligibilityRules: src.eligibilityRules,
        validationRules: src.validationRules,
        scoringRules: src.scoringRules,
        rewardRules: src.rewardRules,
        participantLimit: src.participantLimit,
        tags: src.tags,
        media: src.media,
        metadata: src.metadata,
        createdBy: ctx.actorId,
        updatedBy: ctx.actorId,
      });
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainChallenge",
        entityId: doc.challengeId,
        action: "challenge.duplicate",
        metadata: { sourceChallengeId: challengeId },
        after: snapshotDoc(doc, ["challengeId", "slug", "status"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return doc;
    });
  }

  private async transition(ctx: ActorContext, challengeId: string, to: ChallengeStatus, action: string) {
    const before = await challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
    if (to === "active") {
      this.assertRules(before);
      if (
        before.participantLimit != null &&
        before.participationCount >= before.participantLimit
      ) {
        throw new ConflictError("Challenge participant limit reached");
      }
    }
    const after = await challengeRepository.transitionStatus(ctx.tenantId, challengeId, to, ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainChallenge",
      entityId: challengeId,
      action,
      before: { status: before.status },
      after: { status: after.status },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  private assertRules(data: {
    validationRules?: unknown;
    rewardRules?: unknown;
    scoringRules?: unknown;
  }) {
    // Rules objects are size/operator-validated by Zod; here we ensure reward rules are objects when set.
    for (const [key, val] of Object.entries(data)) {
      if (val === undefined) continue;
      if (val !== null && typeof val !== "object") {
        throw new ValidationError(`${key} must be an object`);
      }
    }
  }

  private assertDates(startAt?: Date | null, endAt?: Date | null) {
    if (startAt && endAt && endAt <= startAt) {
      throw new ValidationError("endAt must be after startAt");
    }
  }
}

export const challengeService = new ChallengeService();
