import { Router, Response } from "express";
import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import { isDbConnected } from "../config/database";
import { ContentBlock } from "../models/ContentBlock";
import { buildSectionsMap, mergeLocaleFallback, type ContentRowLike } from "../lib/contentService";

const router = Router();

const APP_KEYS: ContentAppKey[] = ["main", "challenge", "admin"];

function flattenSections(sections: Record<string, Record<string, string>>): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [sectionKey, fields] of Object.entries(sections)) {
    for (const [contentKey, value] of Object.entries(fields)) {
      flat[`${sectionKey}.${contentKey}`] = value;
    }
  }
  return flat;
}

function firstQuery(value: unknown, fallback = ""): string {
  const raw = Array.isArray(value) ? value[0] : value;
  // Proxies that double-append search can produce "en?appKey=main" — take the first segment only.
  return String(raw ?? fallback).split("?")[0].trim();
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

  try {
    if (isDbConnected()) {
      const rows = await ContentBlock.find({ appKey, pageKey, locale, isActive: true }).lean();
      let sections = buildSectionsMap(rows as unknown as ContentRowLike[]);

      if (Object.keys(sections).length === 0 && locale !== "en") {
        const fallback = await ContentBlock.find({ appKey, pageKey, locale: "en", isActive: true }).lean();
        sections = mergeLocaleFallback(
          rows as unknown as ContentRowLike[],
          fallback as unknown as ContentRowLike[]
        );
      }

      const flat = flattenSections(sections);
      res.setHeader("Cache-Control", "no-store, max-age=0");
      res.json({
        success: true,
        data: {
          appKey,
          pageKey,
          locale,
          sections,
          ...flat,
        },
        blocks: rows.map((r) => ({
          sectionKey: r.sectionKey,
          contentKey: r.contentKey,
          value: r.value,
          type: r.type,
          locale: r.locale,
        })),
      });
      return;
    }

    res.json({ success: true, data: { appKey, pageKey, locale, sections: {} }, blocks: [] });
  } catch (err) {
    console.error("[content GET]", err);
    res.json({ success: true, data: { appKey, pageKey, locale, sections: {} }, blocks: [] });
  }
});

export default router;
