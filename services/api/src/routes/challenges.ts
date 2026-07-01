import { Router, Response } from "express";
import { Challenge } from "../models/Challenge";
import { requireAdmin, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

router.get("/", requireAdmin, async (_req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
    const rows = await Challenge.find().sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: rows.map((c) => ({
        id: String(c._id),
        title: c.title,
        description: c.description,
        reward: c.reward,
        status: c.isActive ? "active" : "scheduled",
        ends: c.endsAt?.toISOString?.()?.slice(0, 10) ?? "",
        participants: 0,
      })),
    });
  } catch (err) {
    console.error("[challenges] list error:", err);
    res.status(500).json({ success: false, error: "Failed to load challenges" });
  }
});

export default router;
