import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";
import { RaidEvent } from "../models/RaidEvent";

const router = Router();

router.get("/", authMiddleware, async (_req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;
  const events = await RaidEvent.find({ enabled: true }).sort({ order: 1, createdAt: -1 }).lean();
  res.json({
    success: true,
    data: {
      events: events.map((e) => ({
        id: String(e._id),
        title: e.title,
        description: e.description,
        phase: e.phase,
        rewardPreview: e.rewardPreview,
        participantCount: e.participantCount,
        maxParticipants: e.maxParticipants,
        startsAt: e.startsAt?.toISOString(),
        endsAt: e.endsAt?.toISOString(),
      })),
      pastWinners: [],
    },
  });
});

export default router;
