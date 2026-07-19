import { Router, Response } from "express";
import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import { isDbConnected } from "../config/database";
import { getPageCacheConfig } from "../config/cacheConfig";
import { cacheGet } from "../config/redis";
import {
  getContentPageResult,
  UnsafeCacheKeyError,
} from "../services/contentPageService";
import { buildPageContentCacheKey } from "../lib/cache/cacheKeys";
import { parseCacheRecord } from "../lib/cache/cacheEnvelope";
import type { ContentPagePayload } from "../lib/contentService";

const router = Router();

const APP_KEYS: ContentAppKey[] = ["main", "challenge", "admin"];

function firstQuery(value: unknown, fallback = ""): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw ?? fallback).split("?")[0].trim();
}

function applyDebugHeaders(
  res: Response,
  status: string,
  cacheKey: string,
  payloadHash?: string,
  cacheVersion?: string
): void {
  const cfg = getPageCacheConfig();
  if (!cfg.debugHeaders) return;
  res.setHeader("X-Page-Cache", status);
  res.setHeader("X-Page-Cache-Key", cacheKey);
  if (payloadHash) res.setHeader("X-Page-Payload-Hash", payloadHash);
  if (cacheVersion) res.setHeader("X-Page-Cache-Version", cacheVersion);
}

/** GET /api/content?appKey=main&pageKey=dashboard&locale=en */
router.get("/", async (req, res: Response) => {
  const appKey = firstQuery(req.query.appKey, "main") as ContentAppKey;
  const pageKey = firstQuery(req.query.pageKey, "");
  const locale = firstQuery(req.query.locale, "en") as ContentLocale;

  if (!APP_KEYS.includes(appKey)) {
    res.status(400).json({ success: false, error: "appKey must be main, challenge, or admin" });
    return;
  }

  if (!pageKey) {
    res.status(400).json({ success: false, error: "pageKey is required" });
    return;
  }

  if (!["en", "ar", "fr"].includes(locale)) {
    res.status(400).json({ success: false, error: "locale must be en, ar, or fr" });
    return;
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    if (isDbConnected()) {
      const { payload, status, cacheKey, payloadHash, cacheVersion } = await getContentPageResult(
        appKey,
        pageKey,
        locale
      );
      applyDebugHeaders(res, status, cacheKey, payloadHash, cacheVersion);
      res.json(payload);
      return;
    }

    // Mongo down: serve stale Redis payload if present.
    try {
      const cacheKey = buildPageContentCacheKey({ appKey, pageKey, locale });
      const cached = parseCacheRecord(await cacheGet(cacheKey));
      if (cached?.payload) {
        applyDebugHeaders(
          res,
          "STALE",
          cacheKey,
          cached.payloadHash,
          getPageCacheConfig().schemaVersion
        );
        res.json(cached.payload as ContentPagePayload);
        return;
      }
    } catch {
      /* ignore */
    }

    res.status(503).json({
      success: false,
      error: "Database unavailable",
      data: { appKey, pageKey, locale, sections: {} },
      blocks: [],
    });
  } catch (err) {
    if (err instanceof UnsafeCacheKeyError) {
      res.status(400).json({ success: false, error: "Invalid pageKey or locale" });
      return;
    }
    console.error("[content GET]", err instanceof Error ? err.message : err);
    res.status(503).json({
      success: false,
      error: "Content temporarily unavailable",
      data: { appKey, pageKey, locale, sections: {} },
      blocks: [],
    });
  }
});

export default router;
