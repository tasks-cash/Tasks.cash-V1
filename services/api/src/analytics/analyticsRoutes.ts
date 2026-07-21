/**
 * Public analytics ingest routes (optional auth). Client never supplies tenantId/userId.
 */
import { Router, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import { DEFAULT_TENANT } from "../domain/shared/baseSchema";
import {
  trackBatchSchema,
  sessionStartSchema,
  sessionHeartbeatSchema,
  sessionEndSchema,
  consentUpdateSchema,
  identityResolveSchema,
} from "./analyticsSchemas";
import {
  ingestTrackBatch,
  ingestTrackEvent,
  handleConsentUpdate,
  handleIdentityResolve,
  type IngestContext,
} from "./analyticsIngestService";
import { toAnalyticsHttpError } from "./analyticsErrors";
import { assertAnalyticsRateLimit } from "./analyticsRateLimit";
import { EVENT_TYPES } from "../events/eventTypes";
import { startSession } from "./analyticsSession";
import { analyticsMetrics } from "./analyticsMetrics";
import { getAnalyticsConfig } from "./analyticsConfig";

const router = Router();

function tenantFromRequest(req: AuthRequest): string {
  const header = (req.headers["x-tenant-id"] as string | undefined)?.toLowerCase();
  if (header && /^[a-z0-9_-]{1,64}$/.test(header)) return header;
  return DEFAULT_TENANT;
}

function optionalUserId(req: AuthRequest): string | undefined {
  // Prefer already-authenticated middleware user when present
  const fromMiddleware = req.user?._id?.toString?.();
  if (fromMiddleware) return fromMiddleware;

  const header = req.headers.authorization;
  const token =
    header?.startsWith("Bearer ")
      ? header.slice(7)
      : (req as { cookies?: { tasks_cash_token?: string } }).cookies?.tasks_cash_token;
  if (!token || !process.env.JWT_SECRET) return undefined;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as { userId?: string; sub?: string };
    return payload.userId ?? payload.sub;
  } catch {
    return undefined;
  }
}

function ingestCtx(req: AuthRequest, appKey = "main"): IngestContext {
  return {
    tenantId: tenantFromRequest(req),
    appKey,
    userId: optionalUserId(req),
    ip: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  };
}

async function rateLimit(req: AuthRequest, _res: Response, next: NextFunction) {
  try {
    await assertAnalyticsRateLimit(req.ip || "unknown");
    next();
  } catch (err) {
    const mapped = toAnalyticsHttpError(err);
    _res.status(mapped.status).json(mapped.body);
  }
}

router.use(rateLimit);

router.post("/track", async (req: AuthRequest, res: Response) => {
  try {
    const cfg = getAnalyticsConfig();
    if (!cfg.enabled || !cfg.ingestEnabled) {
      res.status(503).json({ success: false, error: "Analytics disabled" });
      return;
    }
    const batch = trackBatchSchema.parse(req.body);
    const results = await ingestTrackBatch(ingestCtx(req, batch.appKey), batch);
    res.status(202).json({
      success: true,
      data: {
        accepted: results.filter((r) => !r.skipped && r.eventId).length,
        skipped: results.filter((r) => r.skipped).length,
        results,
      },
    });
  } catch (err) {
    const mapped = toAnalyticsHttpError(err);
    res.status(mapped.status).json(mapped.body);
  }
});

router.post("/session/start", async (req: AuthRequest, res: Response) => {
  try {
    const data = sessionStartSchema.parse(req.body);
    const ctx = ingestCtx(req, data.appKey);
    const session = await startSession({
      tenantId: ctx.tenantId,
      appKey: data.appKey,
      anonymousId: data.anonymousId,
      userId: ctx.userId,
      landingPage: data.landingPage,
      referrer: data.referrer,
      locale: data.locale,
      timezone: data.timezone,
      viewportCategory: data.viewportCategory,
      platformCategory: data.platformCategory,
      consentState: data.consentState,
    });
    analyticsMetrics.sessionStart();
    await ingestTrackEvent(ctx, {
      eventType: EVENT_TYPES.ANALYTICS_SESSION_STARTED,
      anonymousId: data.anonymousId,
      sessionId: session.analyticsSessionId,
      landingPage: data.landingPage,
      referrer: data.referrer,
      locale: data.locale,
      timezone: data.timezone,
      viewportCategory: data.viewportCategory,
      platformCategory: data.platformCategory,
      consentState: data.consentState,
      attribution: data.attribution,
    });
    res.status(201).json({
      success: true,
      data: {
        sessionId: session.analyticsSessionId,
        isReturning: session.isReturning,
      },
    });
  } catch (err) {
    const mapped = toAnalyticsHttpError(err);
    res.status(mapped.status).json(mapped.body);
  }
});

router.post("/session/heartbeat", async (req: AuthRequest, res: Response) => {
  try {
    const data = sessionHeartbeatSchema.parse(req.body);
    const ctx = ingestCtx(req, data.appKey);
    const result = await ingestTrackEvent(ctx, {
      eventType: EVENT_TYPES.ANALYTICS_SESSION_HEARTBEAT,
      anonymousId: data.anonymousId,
      sessionId: data.sessionId,
      activeDurationMs: data.activeDurationMs,
      route: data.route,
      consentState: data.consentState,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const mapped = toAnalyticsHttpError(err);
    res.status(mapped.status).json(mapped.body);
  }
});

router.post("/session/end", async (req: AuthRequest, res: Response) => {
  try {
    const data = sessionEndSchema.parse(req.body);
    const ctx = ingestCtx(req, data.appKey);
    const result = await ingestTrackEvent(ctx, {
      eventType: EVENT_TYPES.ANALYTICS_SESSION_ENDED,
      anonymousId: data.anonymousId,
      sessionId: data.sessionId,
      route: data.exitPage,
      activeDurationMs: data.activeDurationMs,
      consentState: data.consentState,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    const mapped = toAnalyticsHttpError(err);
    res.status(mapped.status).json(mapped.body);
  }
});

router.post("/consent", async (req: AuthRequest, res: Response) => {
  try {
    const data = consentUpdateSchema.parse(req.body);
    const ctx = ingestCtx(req, data.appKey);
    const consent = await handleConsentUpdate(ctx, data);
    res.json({
      success: true,
      data: {
        consentState: consent.consentState,
        analyticsAllowed: consent.analyticsAllowed,
        marketingAllowed: consent.marketingAllowed,
      },
    });
  } catch (err) {
    const mapped = toAnalyticsHttpError(err);
    res.status(mapped.status).json(mapped.body);
  }
});

router.post("/identity/resolve", async (req: AuthRequest, res: Response) => {
  try {
    const data = identityResolveSchema.parse(req.body);
    const ctx = ingestCtx(req, data.appKey);
    if (!ctx.userId) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }
    const result = await handleIdentityResolve(ctx, {
      anonymousId: data.anonymousId,
      reason: data.reason,
    });
    res.json({
      success: true,
      data: {
        analyticsIdentityId: result.identity.analyticsIdentityId,
        merged: result.merged,
        userId: result.identity.userId,
      },
    });
  } catch (err) {
    const mapped = toAnalyticsHttpError(err);
    res.status(mapped.status).json(mapped.body);
  }
});

export default router;
