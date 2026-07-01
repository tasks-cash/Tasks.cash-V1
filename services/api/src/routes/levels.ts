import { Router, Response } from "express";
import { Level } from "../models/Level";
import { requireAdmin, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

router.get("/", requireAdmin, async (_req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
    const rows = await Level.find().sort({ level: 1 }).lean();
    res.json({
      success: true,
      data: rows.map((l) => ({
        id: String(l._id),
        level: l.level,
        title: l.title,
        xpRequired: l.xpRequired,
        reward: l.perks?.[0] ?? "",
        perks: l.perks ?? [],
      })),
    });
  } catch (err) {
    console.error("[levels] list error:", err);
    res.status(500).json({ success: false, error: "Failed to load levels" });
  }
});

export default router;
