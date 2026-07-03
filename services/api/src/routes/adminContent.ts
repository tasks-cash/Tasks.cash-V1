import { Router, Response } from "express";
import { z } from "zod";
import type { ContentLocale } from "@tasks-cash/types";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { isDbConnected } from "../config/database";
import { ContentBlock } from "../models/ContentBlock";
import {
  createContentBlock,
  deleteContentBlock,
  listContentBlocks,
  listPageKeys,
  updateContentBlock,
} from "../lib/contentStore";

const router = Router();
router.use(authMiddleware, adminMiddleware);

const blockSchema = z.object({
  pageKey: z.string().min(1),
  sectionKey: z.string().min(1).default("main"),
  contentKey: z.string().min(1),
  type: z.enum(["title", "subtitle", "description", "button", "label", "notice"]),
  value: z.string().min(1),
  locale: z.enum(["en", "ar", "fr"]),
  isActive: z.boolean().optional(),
});

/** GET /api/admin/content */
router.get("/", async (req: AuthRequest, res: Response) => {
  const pageKey = req.query.pageKey ? String(req.query.pageKey) : undefined;
  const locale = req.query.locale ? (String(req.query.locale) as ContentLocale) : undefined;

  if (isDbConnected()) {
    const filter: Record<string, unknown> = {};
    if (pageKey) filter.pageKey = pageKey;
    if (locale) filter.locale = locale;
    const rows = await ContentBlock.find(filter).sort({ pageKey: 1, locale: 1, sectionKey: 1 }).lean();
    const pages = [...new Set(rows.map((r) => r.pageKey))];
    res.json({ success: true, data: { blocks: rows, pages } });
    return;
  }

  const blocks = listContentBlocks({ pageKey, locale });
  res.json({ success: true, data: { blocks, pages: listPageKeys() } });
});

/** POST /api/admin/content */
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = blockSchema.parse(req.body);

    if (isDbConnected()) {
      const created = await ContentBlock.create(data);
      res.status(201).json({ success: true, data: created });
      return;
    }

    const created = createContentBlock(data);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to create content block" });
  }
});

/** PATCH /api/admin/content/:id */
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  try {
    const data = blockSchema.partial().parse(req.body);

    if (isDbConnected()) {
      const updated = await ContentBlock.findByIdAndUpdate(id, data, { new: true });
      if (!updated) {
        res.status(404).json({ success: false, error: "Content block not found" });
        return;
      }
      res.json({ success: true, data: updated });
      return;
    }

    const updated = updateContentBlock(id, data);
    if (!updated) {
      res.status(404).json({ success: false, error: "Content block not found" });
      return;
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to update content block" });
  }
});

/** DELETE /api/admin/content/:id */
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  if (isDbConnected()) {
    const deleted = await ContentBlock.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Content block not found" });
      return;
    }
    res.json({ success: true });
    return;
  }

  const ok = deleteContentBlock(id);
  if (!ok) {
    res.status(404).json({ success: false, error: "Content block not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
