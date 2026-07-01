import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";
import { DuelMatch } from "../models/DuelMatch";

const router = Router();

router.get("/", authMiddleware, async (_req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;
  const matches = await DuelMatch.find({ enabled: true }).sort({ order: 1, createdAt: -1 }).lean();
  res.json({
    success: true,
    data: matches.map((m) => ({
      id: String(m._id),
      title: m.title,
      challenger: m.challenger,
      opponent: m.opponent,
      stakePreview: m.stakePreview,
      status: m.status,
      rewardPreview: m.rewardPreview,
    })),
  });
});

export default router;
