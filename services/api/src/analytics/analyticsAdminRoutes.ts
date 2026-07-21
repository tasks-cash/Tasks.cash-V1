/**
 * Admin analytics reporting routes.
 */
import { Router, Response } from "express";
import {
  authMiddleware,
  adminMiddleware,
  requireAdminPermission,
  AuthRequest,
} from "../middleware/auth";
import { actorContext, sendDomainError } from "../domain/http/adminHelpers";
import { adminAnalyticsQuerySchema } from "./analyticsSchemas";
import {
  aggregateEventCounts,
  attributionSummary,
  funnelReport,
  retentionSnapshot,
  conversionTouches,
} from "./analyticsAggregation";
import { AnalyticsIdentity, AnalyticsSession, AnalyticsAttribution } from "./analyticsModels";
import { analyticsMetrics } from "./analyticsMetrics";
import { cleanupAnalyticsData } from "./analyticsCleanup";
import { writeDomainAudit } from "../domain/services/domainAudit";
import { redactAnalyticsValue } from "./analyticsRedaction";

const router = Router();
router.use(authMiddleware, adminMiddleware);

router.get("/overview", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const q = adminAnalyticsQuerySchema.parse(req.query);
    const [counts, attribution, retention, touches, funnel] = await Promise.all([
      aggregateEventCounts({
        tenantId: ctx.tenantId,
        appKey: q.appKey,
        since: q.since,
        until: q.until,
      }),
      attributionSummary({
        tenantId: ctx.tenantId,
        appKey: q.appKey,
        since: q.since,
        until: q.until,
      }),
      retentionSnapshot({ tenantId: ctx.tenantId, appKey: q.appKey }),
      conversionTouches({ tenantId: ctx.tenantId, appKey: q.appKey, since: q.since }),
      funnelReport({
        tenantId: ctx.tenantId,
        appKey: q.appKey,
        since: q.since,
        until: q.until,
      }),
    ]);
    res.json({
      success: true,
      data: {
        eventCounts: counts,
        attribution,
        retention,
        conversionTouches: touches,
        funnel,
        metrics: analyticsMetrics.snapshot(),
      },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/sessions", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const q = adminAnalyticsQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (q.appKey) filter.appKey = q.appKey;
    if (q.anonymousId) filter.anonymousId = q.anonymousId;
    if (q.userId) filter.userId = q.userId;
    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      AnalyticsSession.find(filter).sort({ startedAt: -1 }).skip(skip).limit(q.limit).lean(),
      AnalyticsSession.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items,
      meta: { page: q.page, limit: q.limit, total },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/identities", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const q = adminAnalyticsQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (q.appKey) filter.appKey = q.appKey;
    if (q.anonymousId) filter.anonymousId = q.anonymousId;
    if (q.userId) filter.userId = q.userId;
    const skip = (q.page - 1) * q.limit;
    const [items, total] = await Promise.all([
      AnalyticsIdentity.find(filter).sort({ lastSeenAt: -1 }).skip(skip).limit(q.limit).lean(),
      AnalyticsIdentity.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items.map((i) => redactAnalyticsValue(i)),
      meta: { page: q.page, limit: q.limit, total },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/attribution", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const q = adminAnalyticsQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { tenantId: ctx.tenantId };
    if (q.appKey) filter.appKey = q.appKey;
    if (q.utm_source) filter.utm_source = q.utm_source.toLowerCase();
    if (q.utm_campaign) filter.utm_campaign = q.utm_campaign.toLowerCase();
    if (q.since || q.until) {
      filter.capturedAt = {
        ...(q.since ? { $gte: q.since } : {}),
        ...(q.until ? { $lte: q.until } : {}),
      };
    }
    const skip = (q.page - 1) * q.limit;
    const [items, total, summary] = await Promise.all([
      AnalyticsAttribution.find(filter).sort({ capturedAt: -1 }).skip(skip).limit(q.limit).lean(),
      AnalyticsAttribution.countDocuments(filter),
      attributionSummary({
        tenantId: ctx.tenantId,
        appKey: q.appKey,
        since: q.since,
        until: q.until,
      }),
    ]);
    res.json({
      success: true,
      data: { items, summary },
      meta: { page: q.page, limit: q.limit, total },
    });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/funnels", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const q = adminAnalyticsQuerySchema.parse(req.query);
    const data = await funnelReport({
      tenantId: ctx.tenantId,
      appKey: q.appKey,
      since: q.since,
      until: q.until,
    });
    res.json({ success: true, data });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/retention", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const q = adminAnalyticsQuerySchema.parse(req.query);
    const data = await retentionSnapshot({ tenantId: ctx.tenantId, appKey: q.appKey });
    res.json({ success: true, data });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.get("/conversions", requireAdminPermission("analytics.read"), async (req: AuthRequest, res: Response) => {
  try {
    const ctx = actorContext(req);
    const q = adminAnalyticsQuerySchema.parse(req.query);
    const data = await conversionTouches({
      tenantId: ctx.tenantId,
      appKey: q.appKey,
      since: q.since,
    });
    res.json({ success: true, data });
  } catch (err) {
    sendDomainError(res, err);
  }
});

router.post(
  "/cleanup",
  requireAdminPermission("analytics.manage"),
  async (req: AuthRequest, res: Response) => {
    try {
      const ctx = actorContext(req);
      const dryRun = req.body?.dryRun !== false;
      const result = await cleanupAnalyticsData({
        dryRun,
        tenantId: ctx.tenantId,
      });
      await writeDomainAudit({
        tenantId: ctx.tenantId,
        actorId: ctx.actorId,
        entity: "AnalyticsCleanup",
        entityId: "cleanup",
        action: dryRun ? "analytics.cleanup.dry_run" : "analytics.cleanup",
        after: result,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
      res.json({ success: true, data: { dryRun, ...result } });
    } catch (err) {
      sendDomainError(res, err);
    }
  }
);

export default router;
