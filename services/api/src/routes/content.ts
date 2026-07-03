import { Router, Response } from "express";
import type { ContentLocale } from "@tasks-cash/types";
import { isDbConnected } from "../config/database";
import { ContentBlock } from "../models/ContentBlock";
import { getPageContent } from "../lib/contentStore";

const router = Router();

/** GET /api/content?pageKey=dashboard&locale=en */
router.get("/", async (req, res: Response) => {
  const pageKey = String(req.query.pageKey ?? "").trim();
  const locale = String(req.query.locale ?? "en").trim() as ContentLocale;

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
      const rows = await ContentBlock.find({ pageKey, locale, isActive: true }).lean();
      if (rows.length === 0 && locale !== "en") {
        const fallback = await ContentBlock.find({ pageKey, locale: "en", isActive: true }).lean();
        const map = Object.fromEntries(fallback.map((r) => [r.contentKey, r.value]));
        res.json({ success: true, data: { pageKey, locale, content: map } });
        return;
      }
      const map = Object.fromEntries(rows.map((r) => [r.contentKey, r.value]));
      res.json({ success: true, data: { pageKey, locale, content: map } });
      return;
    }

    res.json({ success: true, data: { pageKey, locale, content: getPageContent(pageKey, locale) } });
  } catch (err) {
    console.error("[content GET]", err);
    res.json({ success: true, data: { pageKey, locale, content: getPageContent(pageKey, locale) } });
  }
});

export default router;
