import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { tenantIdSchema } from "../validation/schemas";
import { toHttpError } from "../services/errors";
import type { ActorContext } from "../services/serviceTypes";
import { toPublicDto } from "../validation/schemas";

export function actorContext(req: AuthRequest): ActorContext {
  const parsed = tenantIdSchema.safeParse(req.authorizedTenantId);
  if (!parsed.success) {
    throw new Error("Authorized tenant context is required");
  }
  return {
    tenantId: parsed.data,
    actorId: req.admin?._id?.toString?.() ?? req.user?._id?.toString?.() ?? "unknown",
    ip: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  };
}

export function sendDomainError(res: Response, err: unknown): void {
  const mapped = toHttpError(err);
  if (mapped.status >= 500) {
    console.error(JSON.stringify({
      level: "error",
      ts: new Date().toISOString(),
      service: "adminDomainRoutes",
      error: err instanceof Error ? err.message : "unknown",
    }));
  }
  res.status(mapped.status).json(mapped.body);
}

export function jsonDoc(res: Response, doc: unknown, publicIdField: string, status = 200): void {
  const raw =
    doc && typeof (doc as { toObject?: () => Record<string, unknown> }).toObject === "function"
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : (doc as Record<string, unknown>);
  res.status(status).json({ success: true, data: toPublicDto(raw, publicIdField) });
}

export function jsonPage(res: Response, page: { items: unknown[]; page: number; limit: number; total: number; hasMore: boolean }, publicIdField: string): void {
  res.json({
    success: true,
    data: {
      ...page,
      items: page.items.map((item) => {
        const raw =
          item && typeof (item as { toObject?: () => Record<string, unknown> }).toObject === "function"
            ? (item as { toObject: () => Record<string, unknown> }).toObject()
            : (item as Record<string, unknown>);
        return toPublicDto(raw, publicIdField);
      }),
    },
  });
}
