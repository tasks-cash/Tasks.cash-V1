import { missionRepository, challengeRepository } from "../repositories";
import { createMissionSchema, updateMissionSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { ValidationError } from "./errors";
import { ActorContext, snapshotDoc } from "./serviceTypes";

export class MissionService {
  async list(ctx: ActorContext, query: Record<string, unknown>) {
    return timed({ service: "MissionService", entity: "DomainMission", operation: "list", tenant: ctx.tenantId }, async () => {
      const page = paginationSchema.parse(query);
      const filter: Record<string, unknown> = {};
      if (typeof query.challengeId === "string") filter.challengeId = query.challengeId;
      if (typeof query.campaignId === "string") filter.campaignId = query.campaignId;
      if (typeof query.status === "string") filter.status = query.status;
      return missionRepository.list(ctx.tenantId, filter, {
        ...page,
        sortBy: page.sortBy ?? "order",
        sortDir: page.sortDir ?? "asc",
      });
    });
  }

  async get(ctx: ActorContext, missionId: string) {
    return missionRepository.requireByPublicId(ctx.tenantId, missionId);
  }

  async create(ctx: ActorContext, raw: unknown) {
    return timed({ service: "MissionService", entity: "DomainMission", operation: "create", tenant: ctx.tenantId }, async () => {
      const data = createMissionSchema.parse(raw);
      if (data.challengeId) {
        await challengeRepository.requireByPublicId(ctx.tenantId, data.challengeId);
      }
      this.assertRequirements(data);
      const doc = await missionRepository.create(ctx.tenantId, {
        ...data,
        createdBy: ctx.actorId,
        updatedBy: ctx.actorId,
      });

      if (data.challengeId) {
        const ch = await challengeRepository.requireByPublicId(ctx.tenantId, data.challengeId);
        if (!ch.missionIds.includes(doc.missionId)) {
          ch.missionIds = [...ch.missionIds, doc.missionId];
          ch.updatedBy = ctx.actorId;
          await ch.save();
        }
      }

      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainMission",
        entityId: doc.missionId,
        action: "mission.create",
        after: snapshotDoc(doc, ["missionId", "name", "order", "status", "missionType"]),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return doc;
    });
  }

  async update(ctx: ActorContext, missionId: string, raw: unknown) {
    const data = updateMissionSchema.parse(raw);
    this.assertRequirements(data);
    const before = await missionRepository.requireByPublicId(ctx.tenantId, missionId);
    const after = await missionRepository.updateByPublicId(ctx.tenantId, missionId, data, ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainMission",
      entityId: missionId,
      action: "mission.update",
      before: snapshotDoc(before, ["status", "order", "name"]),
      after: snapshotDoc(after, ["status", "order", "name"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  async reorder(ctx: ActorContext, challengeId: string, orderedMissionIds: string[]) {
    return timed({ service: "MissionService", entity: "DomainMission", operation: "reorder", tenant: ctx.tenantId }, async () => {
      await challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
      if (!Array.isArray(orderedMissionIds) || orderedMissionIds.length === 0) {
        throw new ValidationError("orderedMissionIds must be a non-empty array");
      }
      const updated = [];
      for (let i = 0; i < orderedMissionIds.length; i++) {
        const id = orderedMissionIds[i];
        const m = await missionRepository.requireByPublicId(ctx.tenantId, id);
        if (m.challengeId !== challengeId) {
          throw new ValidationError(`Mission ${id} does not belong to challenge ${challengeId}`);
        }
        updated.push(await missionRepository.updateByPublicId(ctx.tenantId, id, { order: i }, ctx.actorId));
      }
      const ch = await challengeRepository.requireByPublicId(ctx.tenantId, challengeId);
      ch.missionIds = orderedMissionIds;
      ch.updatedBy = ctx.actorId;
      await ch.save();
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "DomainChallenge",
        entityId: challengeId,
        action: "mission.reorder",
        after: { missionIds: orderedMissionIds },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      return updated;
    });
  }

  async enable(ctx: ActorContext, missionId: string) {
    return this.setStatus(ctx, missionId, "active", "mission.enable");
  }

  async disable(ctx: ActorContext, missionId: string) {
    return this.setStatus(ctx, missionId, "paused", "mission.disable");
  }

  async softDelete(ctx: ActorContext, missionId: string) {
    const before = await missionRepository.requireByPublicId(ctx.tenantId, missionId);
    const after = await missionRepository.softDelete(ctx.tenantId, missionId, ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainMission",
      entityId: missionId,
      action: "mission.delete",
      before: snapshotDoc(before, ["status"]),
      after: { deletedAt: (after as { deletedAt?: Date }).deletedAt },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  async duplicate(ctx: ActorContext, missionId: string) {
    const src = await missionRepository.requireByPublicId(ctx.tenantId, missionId);
    const doc = await missionRepository.create(ctx.tenantId, {
      appKey: src.appKey,
      campaignId: src.campaignId,
      challengeId: src.challengeId,
      name: `${src.name} (Copy)`,
      description: src.description,
      instructions: src.instructions,
      missionType: src.missionType,
      status: "draft",
      order: src.order + 1,
      isRequired: src.isRequired,
      perUserCompletionLimit: src.perUserCompletionLimit,
      validationMethod: src.validationMethod,
      validationRules: src.validationRules,
      scoringRules: src.scoringRules,
      rewardRules: src.rewardRules,
      evidenceRequirements: src.evidenceRequirements,
      cooldown: src.cooldown,
      tags: src.tags,
      metadata: src.metadata,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    });
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainMission",
      entityId: doc.missionId,
      action: "mission.duplicate",
      metadata: { sourceMissionId: missionId },
      after: snapshotDoc(doc, ["missionId", "name", "status"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  }

  private async setStatus(
    ctx: ActorContext,
    missionId: string,
    status: "active" | "paused" | "draft" | "completed" | "archived",
    action: string
  ) {
    const before = await missionRepository.requireByPublicId(ctx.tenantId, missionId);
    const after = await missionRepository.updateByPublicId(ctx.tenantId, missionId, { status }, ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "DomainMission",
      entityId: missionId,
      action,
      before: { status: before.status },
      after: { status: after.status },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  private assertRequirements(data: { isRequired?: boolean; perUserCompletionLimit?: number; validationMethod?: string }) {
    if (data.perUserCompletionLimit != null && data.perUserCompletionLimit < 1) {
      throw new ValidationError("perUserCompletionLimit must be ≥ 1");
    }
    if (data.isRequired && data.validationMethod === undefined && "validationMethod" in data) {
      throw new ValidationError("Required missions must declare a validationMethod");
    }
  }
}

export const missionService = new MissionService();
