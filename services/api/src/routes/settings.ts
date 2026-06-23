import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getOrCreateUserSettings, updateUserSettings } from "../services/notificationService";

const router = Router();

const settingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  missionAlerts: z.boolean().optional(),
  referralAlerts: z.boolean().optional(),
  leaderboardVisible: z.boolean().optional(),
  theme: z.enum(["dark", "system"]).optional(),
  language: z.string().min(2).max(10).optional(),
});

/** GET /api/settings */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const settings = await getOrCreateUserSettings(req.user!._id.toString());
  res.json({ success: true, data: settings });
});

/** PATCH /api/settings */
router.patch("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const updates = settingsSchema.parse(req.body);
    const settings = await updateUserSettings(req.user!._id.toString(), updates);
    res.json({ success: true, data: settings });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to update settings" });
  }
});

export default router;
