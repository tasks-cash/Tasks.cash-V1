import { Types } from "mongoose";
import { analyticsEventRepository } from "../repositories";
import { ingestAnalyticsEventSchema, paginationSchema } from "../validation/schemas";
import { writeDomainAudit } from "./domainAudit";
import { timed } from "./domainLogger";
import { ActorContext } from "./serviceTypes";
import { AnalyticsEvent } from "../models/AnalyticsEvent";
import { buildTenantFilter } from "../repositories/tenantRepository";

export class AnalyticsService {
  async ingest(ctx: ActorContext, raw: unknown) {
    return timed(
      { service: "AnalyticsService", entity: "AnalyticsEvent", operation: "ingest", tenant: ctx.tenantId },
      async () => {
        const data = ingestAnalyticsEventSchema.parse(raw);
        const event = await analyticsEventRepository.ingest(ctx.tenantId, {
          ...data,
          userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
        });
        // Lightweight domain-event emit (structured log; no external bus yet)
        console.log(
          JSON.stringify({
            level: "info",
            ts: new Date().toISOString(),
            domainEvent: "analytics.ingested",
            tenant: ctx.tenantId,
            eventName: event.eventName,
            eventId: event.eventId,
          })
        );
        return event;
      }
    );
  }

  /** Aggregate counters for a tenant + optional eventName window. */
  async aggregateCounters(
    ctx: ActorContext,
    input: { eventName?: string; since?: Date; limit?: number } = {}
  ) {
    const match = buildTenantFilter(ctx.tenantId, {
      ...(input.eventName ? { eventName: input.eventName } : {}),
      ...(input.since ? { occurredAt: { $gte: input.since } } : {}),
    });
    const rows = await AnalyticsEvent.aggregate([
      { $match: match },
      { $group: { _id: "$eventName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Math.min(input.limit ?? 50, 100) },
    ]);
    await writeDomainAudit({
      tenantId: ctx.tenantId,
      actorId: ctx.actorId,
      entity: "AnalyticsEvent",
      entityId: "aggregate",
      action: "analytics.aggregate",
      after: { rowCount: rows.length },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return rows.map((r: { _id: string; count: number }) => ({
      eventName: r._id,
      count: r.count,
    }));
  }

  async list(ctx: ActorContext, query: Record<string, unknown> = {}) {
    paginationSchema.parse(query); // validate only — list via aggregate/find with tenant filter
    const filter = buildTenantFilter(ctx.tenantId, {
      ...(typeof query.eventName === "string" ? { eventName: query.eventName } : {}),
    });
    const limit = Math.min(Number(query.limit) || 20, 100);
    const page = Math.max(Number(query.page) || 1, 1);
    const [items, total] = await Promise.all([
      AnalyticsEvent.find(filter)
        .sort({ occurredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      AnalyticsEvent.countDocuments(filter).exec(),
    ]);
    return { items, page, limit, total, hasMore: page * limit < total };
  }
}

export const analyticsService = new AnalyticsService();
