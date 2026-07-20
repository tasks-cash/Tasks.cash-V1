import { Request, Response, NextFunction } from "express";
import {
  generateCorrelationId,
  generateRequestId,
} from "./redact";
import { runWithContext, updateContext, type RequestContext } from "./context";
import { logger, getObservabilityConfig } from "./logger";
import { redact } from "./redact";
import type { AuthRequest } from "../middleware/auth";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
      correlationId?: string;
    }
  }
}

/**
 * Assigns requestId + correlationId and binds AsyncLocalStorage context.
 * Must run before routes.
 */
export function requestContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingCorrelation =
    (typeof req.headers["x-correlation-id"] === "string" && req.headers["x-correlation-id"]) ||
    (typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"]) ||
    generateCorrelationId();
  const requestId =
    (typeof req.headers["x-request-id"] === "string" && req.headers["x-request-id"]) ||
    generateRequestId();

  req.requestId = requestId;
  req.correlationId = incomingCorrelation;
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("X-Correlation-Id", incomingCorrelation);

  const tenantHeader = req.header("x-tenant-id");
  const appKeyHeader = req.header("x-app-key") ?? (typeof req.query.appKey === "string" ? req.query.appKey : undefined);

  const ctx: RequestContext = {
    requestId,
    correlationId: incomingCorrelation,
    tenantId: tenantHeader?.toLowerCase() || "public",
    appKey: appKeyHeader,
    ip: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
    method: req.method,
    route: req.path,
  };

  runWithContext(ctx, () => next());
}

/**
 * After auth middleware, enrich ALS context with authenticated identity.
 */
export function enrichAuthContextMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const userId = req.admin?._id?.toString?.() ?? req.user?._id?.toString?.();
  if (userId) {
    updateContext({
      userId,
      accountType: req.accountType,
    });
  }
  next();
}

/**
 * Structured HTTP access log — replaces morgan for production JSON logs.
 * Does not log bodies, cookies, Authorization, or secrets.
 */
export function httpAccessLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();
  const reqSize = Number(req.headers["content-length"] ?? 0) || 0;

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    const cfg = getObservabilityConfig();
    const authReq = req as AuthRequest;
    const userId = authReq.admin?._id?.toString?.() ?? authReq.user?._id?.toString?.();

    updateContext({
      route: req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path,
      userId: userId ?? getSafeUserId(),
    });

    const fields = {
      category: "http" as const,
      module: "http",
      operation: `${req.method} ${req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path}`,
      method: req.method,
      url: req.originalUrl?.split("?")[0],
      query: redact(sanitizeQuery(req.query)),
      params: redact(req.params),
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      requestSize: reqSize,
      responseSize: Number(res.getHeader("content-length") ?? 0) || undefined,
      userId,
      tenantId: req.header("x-tenant-id") ?? "public",
      requestId: req.requestId,
      correlationId: req.correlationId,
    };

    const msg = `${req.method} ${fields.url} ${res.statusCode}`;
    if (res.statusCode >= 500) {
      logger.error(msg, fields);
    } else if (res.statusCode >= 400) {
      logger.warn(msg, fields);
    } else if (durationMs >= cfg.httpSlowMs) {
      logger.warn(`Slow HTTP: ${msg}`, { ...fields, category: "performance" });
    } else {
      logger.info(msg, fields);
    }
  });

  next();
}

function getSafeUserId(): string | undefined {
  return undefined;
}

function sanitizeQuery(query: Request["query"]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(query ?? {})) {
    out[k] = v;
  }
  return out;
}
