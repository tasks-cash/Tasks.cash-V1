import { getRedis, isRedisReady, acquireLock, releaseLock } from "../../config/redis";
import {
  leaderboardDefinitionRepository,
  leaderboardSnapshotRepository,
  seasonRepository,
} from "../repositories";
import { createLeaderboardDefinitionSchema, createSeasonSchema, updateSeasonSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { ConflictError, ValidationError } from "./errors";
import { ActorContext, snapshotDoc } from "./serviceTypes";
import { logBusinessEvent } from "../../observability/businessEvents";

/** Redis key for live rankings — never stores full Mongo business documents. */
export function leaderboardRedisKey(tenantId: string, leaderboardId: string): string {
  return `lb:rank:${tenantId}:${leaderboardId}`;
}

export class LeaderboardService {
  async listDefinitions(ctx: ActorContext, query: Record<string, unknown> = {}) {
    const page = paginationSchema.parse(query);
    return leaderboardDefinitionRepository.list(ctx.tenantId, {}, page);
  }

  async createDefinition(ctx: ActorContext, raw: unknown) {
    const data = createLeaderboardDefinitionSchema.parse(raw);
    if (data.seasonId) {
      await seasonRepository.requireByPublicId(ctx.tenantId, data.seasonId);
    }
    const doc = await leaderboardDefinitionRepository.create(ctx.tenantId, {
      ...data,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    });
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "LeaderboardDefinition",
      entityId: doc.leaderboardId,
      action: "leaderboard.create",
      after: snapshotDoc(doc, ["leaderboardId", "name", "metric", "status"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  }

  async updateScore(ctx: ActorContext, leaderboardId: string, userId: string, score: number) {
    return timed({ service: "LeaderboardService", entity: "Leaderboard", operation: "updateScore", tenant: ctx.tenantId }, async () => {
      await leaderboardDefinitionRepository.requireByPublicId(ctx.tenantId, leaderboardId);
      if (!Number.isFinite(score)) throw new ValidationError("score must be a finite number");
      if (!isRedisReady()) throw new ConflictError("Redis unavailable for leaderboard updates");
      const redis = getRedis();
      if (!redis) throw new ConflictError("Redis unavailable for leaderboard updates");
      const key = leaderboardRedisKey(ctx.tenantId, leaderboardId);
      await redis.zadd(key, score, userId);
      return { leaderboardId, userId, score };
    });
  }

  async rankingLookup(ctx: ActorContext, leaderboardId: string, limit = 50) {
    await leaderboardDefinitionRepository.requireByPublicId(ctx.tenantId, leaderboardId);
    if (!isRedisReady()) return { entries: [], source: "unavailable" as const };
    const redis = getRedis();
    if (!redis) return { entries: [], source: "unavailable" as const };
    const key = leaderboardRedisKey(ctx.tenantId, leaderboardId);
    const capped = Math.min(Math.max(limit, 1), 100);
    const rows = await redis.zrevrange(key, 0, capped - 1, "WITHSCORES");
    const entries: Array<{ rank: number; userId: string; score: number }> = [];
    for (let i = 0; i < rows.length; i += 2) {
      entries.push({
        rank: entries.length + 1,
        userId: rows[i],
        score: Number(rows[i + 1]),
      });
    }
    return { entries, source: "redis" as const };
  }

  async rebuild(ctx: ActorContext, leaderboardId: string, entries: Array<{ userId: string; score: number }>) {
    return timed({ service: "LeaderboardService", entity: "Leaderboard", operation: "rebuild", tenant: ctx.tenantId }, async () => {
      await leaderboardDefinitionRepository.requireByPublicId(ctx.tenantId, leaderboardId);
      if (!isRedisReady()) throw new ConflictError("Redis unavailable");
      const redis = getRedis();
      if (!redis) throw new ConflictError("Redis unavailable");
      if (!Array.isArray(entries) || entries.length > 10_000) {
        throw new ValidationError("entries must be an array of ≤10000 items");
      }

      const lock = await acquireLock(`lock:lb:rebuild:${ctx.tenantId}:${leaderboardId}`, 15_000);
      if (!lock) throw new ConflictError("Leaderboard rebuild already in progress");
      try {
        const key = leaderboardRedisKey(ctx.tenantId, leaderboardId);
        const pipeline = redis.pipeline();
        pipeline.del(key);
        for (const e of entries) {
          if (!e.userId || !Number.isFinite(e.score)) continue;
          pipeline.zadd(key, e.score, e.userId);
        }
        await pipeline.exec();
        await writeDomainAudit({
          tenantId: ctx.tenantId,
          actorId: ctx.actorId,
          entity: "LeaderboardDefinition",
          entityId: leaderboardId,
          action: "leaderboard.rebuild",
          after: { entryCount: entries.length },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
        logBusinessEvent("LeaderboardRebuilt", {
          entity: "LeaderboardDefinition",
          entityId: leaderboardId,
          tenantId: ctx.tenantId,
          entryCount: entries.length,
        });
        return { rebuilt: true, entryCount: entries.length };
      } finally {
        await releaseLock(lock);
      }
    });
  }

  async archiveSnapshot(
    ctx: ActorContext,
    input: {
      leaderboardId: string;
      periodKey: string;
      appKey?: string;
      seasonId?: string;
      isFinal?: boolean;
      limit?: number;
    }
  ) {
    const { Types } = await import("mongoose");
    const def = await leaderboardDefinitionRepository.requireByPublicId(ctx.tenantId, input.leaderboardId);
    const ranking = await this.rankingLookup(ctx, input.leaderboardId, input.limit ?? 100);
    const entries = ranking.entries
      .filter((e) => Types.ObjectId.isValid(e.userId))
      .map((e) => ({
        rank: e.rank,
        userId: new Types.ObjectId(e.userId),
        score: e.score,
      }));
    const snapshot = await leaderboardSnapshotRepository.upsertPeriod(ctx.tenantId, {
      appKey: input.appKey ?? def.appKey,
      leaderboardId: input.leaderboardId,
      seasonId: input.seasonId ?? def.seasonId,
      periodKey: input.periodKey,
      isFinal: input.isFinal ?? false,
      entries,
    });

    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "LeaderboardSnapshot",
      entityId: snapshot.snapshotId,
      action: "leaderboard.snapshot",
      after: { leaderboardId: input.leaderboardId, periodKey: input.periodKey, isFinal: input.isFinal },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return snapshot;
  }

  async finalizeSeason(ctx: ActorContext, seasonId: string, leaderboardId: string) {
    const season = await seasonRepository.requireByPublicId(ctx.tenantId, seasonId);
    if (season.status !== "active" && season.status !== "completed") {
      // allow finalize from active → completed
    }
    const snapshot = await this.archiveSnapshot(ctx, {
      leaderboardId,
      seasonId,
      periodKey: "final",
      isFinal: true,
      appKey: season.appKey,
    });
    await seasonRepository.updateByPublicId(ctx.tenantId, seasonId, { status: "completed" }, ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "Season",
      entityId: seasonId,
      action: "season.finalize",
      after: { status: "completed", snapshotId: snapshot.snapshotId },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { seasonId, snapshot };
  }
}

export class SeasonService {
  async list(ctx: ActorContext, query: Record<string, unknown> = {}) {
    const page = paginationSchema.parse(query);
    return seasonRepository.list(ctx.tenantId, {}, page);
  }

  async get(ctx: ActorContext, seasonId: string) {
    return seasonRepository.requireByPublicId(ctx.tenantId, seasonId);
  }

  async create(ctx: ActorContext, raw: unknown) {
    const data = createSeasonSchema.parse(raw);
    const doc = await seasonRepository.create(ctx.tenantId, {
      ...data,
      createdBy: ctx.actorId,
      updatedBy: ctx.actorId,
    });
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "Season",
      entityId: doc.seasonId,
      action: "season.create",
      after: snapshotDoc(doc, ["seasonId", "name", "status"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return doc;
  }

  async update(ctx: ActorContext, seasonId: string, raw: unknown) {
    const data = updateSeasonSchema.parse(raw);
    const before = await seasonRepository.requireByPublicId(ctx.tenantId, seasonId);
    const after = await seasonRepository.updateByPublicId(ctx.tenantId, seasonId, data, ctx.actorId);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "Season",
      entityId: seasonId,
      action: "season.update",
      before: snapshotDoc(before, ["status", "name"]),
      after: snapshotDoc(after, ["status", "name"]),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return after;
  }

  async softDelete(ctx: ActorContext, seasonId: string) {
    return seasonRepository.softDelete(ctx.tenantId, seasonId, ctx.actorId);
  }
}

export const leaderboardService = new LeaderboardService();
export const seasonService = new SeasonService();
