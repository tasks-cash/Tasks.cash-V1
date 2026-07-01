import { Router, Response } from "express";
import { Treasure } from "../models/Treasure";
import { requireAdmin, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

router.get("/", requireAdmin, async (_req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
    const rows = await Treasure.find().sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: rows.map((t) => ({
        id: String(t._id),
        name: t.name,
        description: t.description,
        rarity: t.rarity,
        unlocked: 0,
        isActive: t.isActive,
      })),
    });
  } catch (err) {
    console.error("[treasures] list error:", err);
    res.status(500).json({ success: false, error: "Failed to load treasures" });
  }
});

export default router;
