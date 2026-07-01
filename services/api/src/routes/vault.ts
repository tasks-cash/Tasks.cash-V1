import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";
import { VaultItem } from "../models/VaultItem";

const router = Router();

router.get("/", authMiddleware, async (_req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;
  const items = await VaultItem.find({ enabled: true }).sort({ order: 1, createdAt: -1 }).lean();
  res.json({
    success: true,
    data: {
      items: items.map((v) => ({
        id: String(v._id),
        name: v.name,
        rarity: v.rarity,
        description: v.description,
        rewardPreview: v.rewardPreview,
        revealed: v.revealed,
      })),
      recentReveals: [],
    },
  });
});

export default router;
