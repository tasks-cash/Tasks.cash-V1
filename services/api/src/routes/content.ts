import { Router, Response } from "express";
import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import { isDbConnected } from "../config/database";
import { ContentBlock } from "../models/ContentBlock";
import { buildSectionsMap, mergeLocaleFallback, type ContentRowLike } from "../lib/contentService";

const router = Router();

const APP_KEYS: ContentAppKey[] = ["main", "challenge", "admin"];

/** GET /api/content?appKey=main&pageKey=dashboard&locale=en */
router.get("/", async (req, res: Response) => {
  const appKey = String(req.query.appKey ?? "main").trim() as ContentAppKey;
  const pageKey = String(req.query.pageKey ?? "").trim();
  const locale = String(req.query.locale ?? "en").trim() as ContentLocale;

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

      res.json({ success: true, data: { appKey, pageKey, locale, sections } });
      return;
    }

    res.json({ success: true, data: { appKey, pageKey, locale, sections: {} } });
  } catch (err) {
    console.error("[content GET]", err);
    res.json({ success: true, data: { appKey, pageKey, locale, sections: {} } });
  }
});

export default router;
