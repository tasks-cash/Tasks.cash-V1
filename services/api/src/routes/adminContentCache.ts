import { Router, Response } from "express";
import { z } from "zod";
import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import {
  authMiddleware,
  adminMiddleware,
  requireAdminPermission,
  AuthRequest,
} from "../middleware/auth";
import {
  inspectPageCache,
  rebuildPageCache,
  getContentPageResult,
} from "../services/contentPageService";
import { invalidateByReason, invalidateAfterCmsMutation } from "../services/contentCacheInvalidation";
import { writeCacheAuditLog } from "../lib/cache/cacheAudit";
import { getPageCacheConfig } from "../config/cacheConfig";
import { isRedisReady } from "../config/redis";
import { UnsafeCacheKeyError } from "../lib/cache/cacheKeys";

/**
 * Admin-only content cache inspector.
 * Permissions: content.cache.read | invalidate | rebuild
 */

const router = Router();
router.use(authMiddleware, adminMiddleware);

const inspectSchema = z.object({
  appKey: z.enum(["main", "challenge", "admin"]).default("main"),
  pageKey: z.string().min(1),
  locale: z.enum(["en", "ar", "fr"]).default("en"),
});

function actorId(req: AuthRequest): string {
  return req.admin?._id?.toString?.() ?? req.user?._id?.toString?.() ?? "unknown";
}

function mapParamError(err: unknown, res: Response): boolean {
  if (err instanceof z.ZodError || err instanceof UnsafeCacheKeyError) {
    res.status(400).json({ success: false, error: "Invalid parameters" });
    return true;
  }
  return false;
}

/** GET /api/admin/content-cache/config */
router.get(
  "/config",
  requireAdminPermission("content.cache.read"),
  async (req: AuthRequest, res: Response) => {
    const cfg = getPageCacheConfig();
    await writeCacheAuditLog({
      actorId: actorId(req),
      action: "content.cache.config_read",
      resource: "page-content-cache",
      metadata: { result: "ok" },
    });
    res.json({
      success: true,
      data: {
        schemaVersion: cfg.schemaVersion,
        tenant: cfg.tenant,
        enabled: cfg.enabled,
        ttlSeconds: cfg.ttlSeconds,
        staleSeconds: cfg.staleSeconds,
        lockTtlMs: cfg.lockTtlMs,
        lockWaitMs: cfg.lockWaitMs,
        redisDb: cfg.redisDb,
        redisReady: isRedisReady(),
        staleWhileRevalidate: cfg.staleWhileRevalidate,
        debugHeaders: cfg.debugHeaders,
      },
    });
  }
);

/** GET /api/admin/content-cache/inspect?appKey=&pageKey=&locale= */
router.get(
  "/inspect",
  requireAdminPermission("content.cache.read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const q = inspectSchema.parse({
        appKey: req.query.appKey,
        pageKey: req.query.pageKey,
        locale: req.query.locale,
      });
      const data = await inspectPageCache(q);
      await writeCacheAuditLog({
        actorId: actorId(req),
        action: "content.cache.inspected",
        resource: data.cacheKey,
        metadata: {
          appKey: q.appKey,
          pageKey: q.pageKey,
          locale: q.locale,
          state: data.state,
          result: "ok",
        },
      });
      res.json({ success: true, data });
    } catch (err) {
      if (mapParamError(err, res)) return;
      res.status(500).json({ success: false, error: "Inspect failed" });
    }
  }
);

/** POST /api/admin/content-cache/invalidate */
router.post(
  "/invalidate",
  requireAdminPermission("content.cache.invalidate"),
  async (req: AuthRequest, res: Response) => {
    try {
      const body = inspectSchema
        .extend({
          kind: z
            .enum([
              "page",
              "navigation",
              "footer",
              "seo",
              "settings",
              "announcements",
              "statistics",
            ])
            .default("page"),
          reason: z.string().max(200).optional(),
        })
        .parse(req.body);

      let result;
      if (body.kind === "page") {
        result = (
          await invalidateAfterCmsMutation([
            {
              appKey: body.appKey,
              pageKey: body.pageKey,
              sectionKey: "hero",
              locale: body.locale,
            },
          ])
        )[0];
      } else {
        result = await invalidateByReason({
          kind: body.kind,
          appKey: body.appKey,
          pageKey: body.pageKey,
          locale: body.locale,
        });
      }

      await writeCacheAuditLog({
        actorId: actorId(req),
        action: "content.cache.invalidated",
        resource: `${body.appKey}/${body.pageKey}/${body.locale}`,
        metadata: {
          kind: body.kind,
          reason: body.reason ?? "manual",
          keysInvalidated: result?.keysInvalidated ?? 0,
          tags: result?.tags ?? [],
          result: "ok",
        },
      });

      res.json({ success: true, data: result });
    } catch (err) {
      if (mapParamError(err, res)) return;
      console.error("[content-cache invalidate]", err instanceof Error ? err.message : err);
      res.status(500).json({ success: false, error: "Invalidate failed" });
    }
  }
);

/** POST /api/admin/content-cache/rebuild */
router.post(
  "/rebuild",
  requireAdminPermission("content.cache.rebuild"),
  async (req: AuthRequest, res: Response) => {
    try {
      const body = inspectSchema.parse(req.body);
      const rebuilt = await rebuildPageCache({
        appKey: body.appKey as ContentAppKey,
        pageKey: body.pageKey,
        locale: body.locale as ContentLocale,
      });
      const after = await getContentPageResult(
        body.appKey as ContentAppKey,
        body.pageKey,
        body.locale as ContentLocale
      );

      await writeCacheAuditLog({
        actorId: actorId(req),
        action: "content.cache.rebuilt",
        resource: rebuilt.cacheKey,
        metadata: {
          appKey: body.appKey,
          pageKey: body.pageKey,
          locale: body.locale,
          payloadHash: rebuilt.payloadHash,
          statusAfter: after.status,
          result: "ok",
        },
      });

      res.json({
        success: true,
        data: {
          cacheKey: rebuilt.cacheKey,
          payloadHash: rebuilt.payloadHash,
          statusAfter: after.status,
        },
      });
    } catch (err) {
      if (mapParamError(err, res)) return;
      console.error("[content-cache rebuild]", err instanceof Error ? err.message : err);
      res.status(500).json({ success: false, error: "Rebuild failed" });
    }
  }
);

export default router;
