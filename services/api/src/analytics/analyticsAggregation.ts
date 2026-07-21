/**
 * Aggregation, funnel, retention, and conversion reporting helpers.
 */

import { AnalyticsEvent } from "../domain/models/AnalyticsEvent";
import { AnalyticsAttribution, AnalyticsIdentity, AnalyticsSession } from "./analyticsModels";
import { buildTenantFilter } from "../domain/repositories/tenantRepository";

export async function aggregateEventCounts(input: {
  tenantId: string;
  appKey?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}) {
  const match = buildTenantFilter(input.tenantId, {
    ...(input.appKey ? { appKey: input.appKey } : {}),
    ...(input.since || input.until
      ? {
          occurredAt: {
            ...(input.since ? { $gte: input.since } : {}),
            ...(input.until ? { $lte: input.until } : {}),
          },
        }
      : {}),
  });
  const rows = await AnalyticsEvent.aggregate([
    { $match: match },
    { $group: { _id: "$eventName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: Math.min(input.limit ?? 50, 100) },
  ]);
  return rows.map((r: { _id: string; count: number }) => ({ eventName: r._id, count: r.count }));
}

export async function attributionSummary(input: {
  tenantId: string;
  appKey?: string;
  since?: Date;
  until?: Date;
}) {
  const match: Record<string, unknown> = { tenantId: input.tenantId };
  if (input.appKey) match.appKey = input.appKey;
  if (input.since || input.until) {
    match.capturedAt = {
      ...(input.since ? { $gte: input.since } : {}),
      ...(input.until ? { $lte: input.until } : {}),
    };
  }
  const bySource = await AnalyticsAttribution.aggregate([
    { $match: match },
    {
      $group: {
        _id: { source: "$utm_source", campaign: "$utm_campaign" },
        touches: { $sum: 1 },
        conversions: {
          $sum: { $cond: [{ $ifNull: ["$convertedAt", false] }, 1, 0] },
        },
      },
    },
    { $sort: { conversions: -1, touches: -1 } },
    { $limit: 50 },
  ]);
  return bySource.map(
    (r: {
      _id: { source?: string; campaign?: string };
      touches: number;
      conversions: number;
    }) => ({
      utm_source: r._id.source ?? "(none)",
      utm_campaign: r._id.campaign ?? "(none)",
      touches: r.touches,
      conversions: r.conversions,
      conversionRate: r.touches ? r.conversions / r.touches : 0,
    })
  );
}

/** Default registration funnel: session → page → cta → form → conversion/identity */
export async function funnelReport(input: {
  tenantId: string;
  appKey?: string;
  since?: Date;
  until?: Date;
  steps?: string[];
}) {
  const steps =
    input.steps ??
    [
      "session_started",
      "page_viewed",
      "cta_clicked",
      "form_started",
      "form_completed",
      "identity_resolved",
    ];
  const match = buildTenantFilter(input.tenantId, {
    ...(input.appKey ? { appKey: input.appKey } : {}),
    eventName: { $in: steps },
    ...(input.since || input.until
      ? {
          occurredAt: {
            ...(input.since ? { $gte: input.since } : {}),
            ...(input.until ? { $lte: input.until } : {}),
          },
        }
      : {}),
  });
  const rows = await AnalyticsEvent.aggregate([
    { $match: match },
    { $group: { _id: "$eventName", users: { $addToSet: "$anonymousId" }, count: { $sum: 1 } } },
  ]);
  const byName = new Map(rows.map((r: { _id: string; users: string[]; count: number }) => [r._id, r]));
  let previous = 0;
  return steps.map((step, idx) => {
    const row = byName.get(step);
    const unique = row?.users?.filter(Boolean).length ?? 0;
    const count = row?.count ?? 0;
    const dropOff = idx === 0 || previous === 0 ? 0 : Math.max(0, previous - unique);
    const conversionFromStart = idx === 0 || !byName.get(steps[0])?.users?.length
      ? 1
      : unique / Math.max(1, byName.get(steps[0])!.users.filter(Boolean).length);
    previous = unique || previous;
    return { step, count, uniqueVisitors: unique, dropOff, conversionFromStart };
  });
}

export async function retentionSnapshot(input: {
  tenantId: string;
  appKey?: string;
}) {
  const filter: Record<string, unknown> = { tenantId: input.tenantId };
  if (input.appKey) filter.appKey = input.appKey;
  const [total, returning, withUser, sessions] = await Promise.all([
    AnalyticsIdentity.countDocuments(filter),
    AnalyticsIdentity.countDocuments({ ...filter, isReturning: true }),
    AnalyticsIdentity.countDocuments({ ...filter, userId: { $type: "string" } }),
    AnalyticsSession.countDocuments(filter),
  ]);
  return {
    identities: total,
    returningIdentities: returning,
    authenticatedIdentities: withUser,
    sessions,
    returningRate: total ? returning / total : 0,
    authRate: total ? withUser / total : 0,
  };
}

export async function conversionTouches(input: {
  tenantId: string;
  appKey?: string;
  since?: Date;
}) {
  const match: Record<string, unknown> = {
    tenantId: input.tenantId,
    convertedAt: { $type: "date" },
  };
  if (input.appKey) match.appKey = input.appKey;
  if (input.since) match.convertedAt = { $gte: input.since };
  const rows = await AnalyticsAttribution.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$touch",
        count: { $sum: 1 },
      },
    },
  ]);
  return rows.map((r: { _id: string; count: number }) => ({ touch: r._id, count: r.count }));
}
