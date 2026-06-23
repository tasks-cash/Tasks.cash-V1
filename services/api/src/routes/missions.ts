import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Mission } from "../models/Mission";
import { completeMission } from "../services/missionService";

const router = Router();

/** GET /api/missions — list active missions */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const missions = await Mission.find({ isActive: true }).sort({ difficulty: 1 });
  const completed = req.user!.completedMissions.map((id) => id.toString());

  res.json({
    success: true,
    data: missions.map((m) => ({
      ...m.toObject(),
      completed: completed.includes(m._id.toString()),
    })),
  });
});

/** GET /api/missions/:id */
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  const mission = await Mission.findById(req.params.id);
  if (!mission) {
    res.status(404).json({ success: false, error: "Mission not found" });
    return;
  }
  res.json({ success: true, data: mission });
});

/** POST /api/missions/:id/complete */
router.post("/:id/complete", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await completeMission(req.user!._id.toString(), String(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mission completion failed";
    res.status(400).json({ success: false, error: message });
  }
});

export default router;
