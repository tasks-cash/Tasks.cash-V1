import { Router, Response } from "express";
import { z } from "zod";
import type { ContentAppKey, ContentLocale } from "@tasks-cash/types";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { isDbConnected } from "../config/database";
import { ContentBlock } from "../models/ContentBlock";
import { toContentBlock, type ContentRowLike } from "../lib/contentService";
import {
  bulkUpsertContentBlocks,
  createContentBlock,
  deleteContentBlock,
  listContentBlocks,
  listPageKeys,
  updateContentBlock,
} from "../lib/contentStore";
import { auditContentBlocks, importMissingContent, syncContentDefaults } from "../lib/contentAudit";

const router = Router();
router.use(authMiddleware, adminMiddleware);

const CONTENT_TYPES = [
  "title",
  "subtitle",
  "description",
  "button",
  "label",
  "placeholder",
  "empty_state",
  "error_message",
  "success_message",
  "badge",
  "nav",
  "notice",
] as const;

const blockSchema = z.object({
  appKey: z.enum(["main", "challenge", "admin"]).default("main"),
  pageKey: z.string().trim().min(1, "pageKey is required"),
  sectionKey: z.string().trim().min(1, "sectionKey is required").default("main"),
  contentKey: z.string().trim().min(1, "contentKey is required"),
  type: z.enum(CONTENT_TYPES),
  // Allow empty string when admin intentionally clears text
  value: z.string(),
  defaultValue: z.string().optional(),
  description: z.string().optional(),
  locale: z.enum(["en", "ar", "fr"]),
  isActive: z.boolean().optional(),
});

const bulkSchema = z.object({
  blocks: z.array(blockSchema).min(1),
});

const patchSchema = blockSchema.partial().extend({
  resetToDefault: z.boolean().optional(),
  value: z.string().optional(),
});

function parseFilters(req: AuthRequest) {
  return {
    appKey: req.query.appKey ? (String(req.query.appKey) as ContentAppKey) : undefined,
    pageKey: req.query.pageKey ? String(req.query.pageKey) : undefined,
    locale: req.query.locale ? (String(req.query.locale) as ContentLocale) : undefined,
    sectionKey: req.query.sectionKey ? String(req.query.sectionKey) : undefined,
    type: req.query.type ? String(req.query.type) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
  };
}

async function upsertOneBlock(item: z.infer<typeof blockSchema>) {
  const defaultValue = item.defaultValue ?? item.value;
  const now = new Date();

  const doc = await ContentBlock.findOneAndUpdate(
    {
      appKey: item.appKey,
      pageKey: item.pageKey,
      sectionKey: item.sectionKey,
      contentKey: item.contentKey,
      locale: item.locale,
    },
    {
      $set: {
        value: item.value,
        type: item.type,
        defaultValue,
        description: item.description ?? "",
        isActive: item.isActive ?? true,
        updatedAt: now,
      },
      $setOnInsert: {
        appKey: item.appKey,
        pageKey: item.pageKey,
        sectionKey: item.sectionKey,
        contentKey: item.contentKey,
        locale: item.locale,
        createdAt: now,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return toContentBlock(doc.toObject() as unknown as ContentRowLike);
}

/** GET /api/admin/content */
router.get("/", async (req: AuthRequest, res: Response) => {
  const filters = parseFilters(req);

  if (isDbConnected()) {
    const query: Record<string, unknown> = {};
    if (filters.appKey) query.appKey = filters.appKey;
    if (filters.pageKey) query.pageKey = filters.pageKey;
    if (filters.locale) query.locale = filters.locale;
    if (filters.sectionKey) query.sectionKey = filters.sectionKey;
    if (filters.type) query.type = filters.type;

    let rows = await ContentBlock.find(query)
      .sort({ appKey: 1, pageKey: 1, sectionKey: 1, contentKey: 1, locale: 1 })
      .lean();

    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((r) =>
        `${r.pageKey} ${r.sectionKey} ${r.contentKey} ${r.value}`.toLowerCase().includes(q)
      );
    }

    const blocks = rows.map((r) => toContentBlock(r as unknown as ContentRowLike));
    const pages = [...new Set(rows.map((r) => r.pageKey))];
    res.json({ success: true, data: { blocks, pages } });
    return;
  }

  const blocks = listContentBlocks(filters);
  res.json({ success: true, data: { blocks, pages: listPageKeys(filters.appKey) } });
});

/** GET /api/admin/content/audit — CMS coverage report */
router.get("/audit", async (_req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    res.json({
      success: true,
      data: {
        missingKeys: [],
        unwiredPages: [],
        translationGaps: [],
        seedKeyCount: 0,
        dbKeyCount: 0,
        lastUpdated: null,
        generatedAt: new Date().toISOString(),
      },
    });
    return;
  }

  try {
    const report = await auditContentBlocks();
    res.json({ success: true, data: report });
  } catch {
    res.status(500).json({ success: false, error: "Audit failed" });
  }
});

/** POST /api/admin/content/import-missing — insert seed rows not yet in DB */
router.post("/import-missing", async (_req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    res.status(503).json({ success: false, error: "Database not connected" });
    return;
  }

  try {
    const result = await importMissingContent();
    const report = await auditContentBlocks();
    res.json({ success: true, data: { ...result, audit: report } });
  } catch {
    res.status(500).json({ success: false, error: "Import failed" });
  }
});

/** POST /api/admin/content/sync-defaults — update defaultValue from seed; never overwrite admin edits */
router.post("/sync-defaults", async (_req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    res.status(503).json({ success: false, error: "Database not connected" });
    return;
  }

  try {
    const result = await syncContentDefaults();
    const report = await auditContentBlocks();
    res.json({ success: true, data: { ...result, audit: report } });
  } catch {
    res.status(500).json({ success: false, error: "Sync defaults failed" });
  }
});

/** POST /api/admin/content/bulk-upsert */
router.post("/bulk-upsert", async (req: AuthRequest, res: Response) => {
  try {
    const { blocks } = bulkSchema.parse(req.body);

    if (isDbConnected()) {
      const upserted = [];
      for (const item of blocks) {
        upserted.push(await upsertOneBlock(item));
      }
      console.log("[CMS bulk-upsert]", { saved: upserted.length, sample: upserted[0]?.id });
      res.json({ success: true, saved: upserted.length, data: { blocks: upserted }, blocks: upserted });
      return;
    }

    const result = bulkUpsertContentBlocks(
      blocks.map((b) => ({ ...b, defaultValue: b.defaultValue ?? b.value }))
    );
    res.json({
      success: true,
      saved: result.upserted.length,
      data: { blocks: result.upserted },
      blocks: result.upserted,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    console.error("[CMS bulk-upsert]", err);
    res.status(500).json({ success: false, error: "Bulk upsert failed" });
  }
});

/** POST /api/admin/content */
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const data = blockSchema.parse(req.body);
    const payload = { ...data, defaultValue: data.defaultValue ?? data.value };

    if (isDbConnected()) {
      try {
        const created = await ContentBlock.create(payload);
        res.status(201).json({ success: true, data: toContentBlock(created.toObject() as unknown as ContentRowLike) });
        return;
      } catch (err) {
        // Duplicate key → upsert instead of failing
        if ((err as { code?: number }).code === 11000) {
          const updated = await upsertOneBlock(data);
          res.json({ success: true, data: updated });
          return;
        }
        throw err;
      }
    }

    const created = createContentBlock(payload);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    console.error("[CMS create]", err);
    res.status(500).json({ success: false, error: "Failed to create content block" });
  }
});

/** PATCH /api/admin/content/:id */
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);

  if (!id || id === "undefined" || id.startsWith("temp_")) {
    res.status(400).json({ success: false, error: "Valid database content block id is required" });
    return;
  }

  try {
    const data = patchSchema.parse(req.body);

    if (isDbConnected()) {
      const existing = await ContentBlock.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, error: "Content block not found" });
        return;
      }

      const patch: Record<string, unknown> = {};
      if (data.value !== undefined) patch.value = data.value;
      if (data.type !== undefined) patch.type = data.type;
      if (data.defaultValue !== undefined) patch.defaultValue = data.defaultValue;
      if (data.description !== undefined) patch.description = data.description;
      if (data.isActive !== undefined) patch.isActive = data.isActive;

      if (data.resetToDefault) {
        patch.value = existing.defaultValue || existing.value;
      }

      const updated = await ContentBlock.findByIdAndUpdate(id, { $set: patch }, { new: true });
      if (!updated) {
        res.status(404).json({ success: false, error: "Content block not found" });
        return;
      }
      res.json({ success: true, data: toContentBlock(updated.toObject() as unknown as ContentRowLike) });
      return;
    }

    const existing = listContentBlocks().find((b) => b.id === id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Content block not found" });
      return;
    }

    const patch = { ...data };
    if (data.resetToDefault) {
      patch.value = existing.defaultValue;
    }

    const updated = updateContentBlock(id, patch);
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
    console.error("[CMS patch]", err);
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
