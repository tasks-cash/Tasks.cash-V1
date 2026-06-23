import { Router, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";
import { Mission } from "../models/Mission";
import { Reward } from "../models/Reward";
import { Transaction } from "../models/Transaction";

const router = Router();

router.use(authMiddleware, adminMiddleware);

/** GET /api/admin/stats */
router.get("/stats", async (_req, res: Response) => {
  const [userCount, missionCount, rewardCount, totalCoins] = await Promise.all([
    User.countDocuments(),
    Mission.countDocuments({ isActive: true }),
    Reward.countDocuments({ isActive: true }),
    User.aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }]),
  ]);

  res.json({
    success: true,
    data: {
      userCount,
      missionCount,
      rewardCount,
      totalCoinsInCirculation: totalCoins[0]?.total ?? 0,
    },
  });
});

/** GET /api/admin/users */
router.get("/users", async (req, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = 20;
  const users = await User.find()
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  const total = await User.countDocuments();
  res.json({ success: true, data: { users, total, page } });
});

/** POST /api/admin/missions */
router.post("/missions", async (req, res: Response) => {
  const schema = z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.enum(["easy", "medium", "hard", "legendary"]),
    coinReward: z.number().positive(),
    xpReward: z.number().positive(),
    category: z.string().default("general"),
  });
  const data = schema.parse(req.body);
  const mission = await Mission.create(data);
  res.status(201).json({ success: true, data: mission });
});

/** POST /api/admin/rewards */
router.post("/rewards", async (req, res: Response) => {
  const schema = z.object({
    name: z.string(),
    description: z.string(),
    type: z.enum(["coins", "xp", "badge", "item", "multiplier"]),
    rarity: z.enum(["common", "rare", "epic", "legendary"]),
    value: z.number(),
    requiredLevel: z.number().default(1),
    requiredCoins: z.number().optional(),
  });
  const data = schema.parse(req.body);
  const reward = await Reward.create(data);
  res.status(201).json({ success: true, data: reward });
});

/** PATCH /api/admin/users/:id/coins */
router.patch("/users/:id/coins", async (req: AuthRequest, res: Response) => {
  const { amount, reason } = req.body as { amount: number; reason: string };
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  user.coins += amount;
  await user.save();
  await Transaction.create({
    userId: user._id,
    type: "admin_grant",
    amount,
    description: reason ?? "Admin adjustment",
  });
  res.json({ success: true, data: { coins: user.coins } });
});

/** DELETE /api/admin/missions/:id */
router.delete("/missions/:id", async (req, res: Response) => {
  await Mission.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: "Mission deactivated" });
});

/** GET /api/admin/mystery-missions */
router.get("/mystery-missions", async (_req, res: Response) => {
  const { MysteryMission } = await import("../models/MysteryMission");
  const missions = await MysteryMission.find().sort({ createdAt: -1 });
  res.json({ success: true, data: missions });
});

/** POST /api/admin/mystery-missions */
router.post("/mystery-missions", async (req, res: Response) => {
  const { mysteryMissionSchema } = await import("../routes/mysteryMissions");
  const { MysteryMission } = await import("../models/MysteryMission");
  const parsed = mysteryMissionSchema.parse(req.body);
  const payload = {
    ...parsed,
    expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
    scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : undefined,
  };
  const mission = await MysteryMission.create(payload);
  res.status(201).json({ success: true, data: mission });
});

/** PATCH /api/admin/mystery-missions/:id */
router.patch("/mystery-missions/:id", async (req, res: Response) => {
  const { mysteryMissionSchema } = await import("../routes/mysteryMissions");
  const { MysteryMission } = await import("../models/MysteryMission");
  const parsed = mysteryMissionSchema.partial().parse(req.body);
  const payload = {
    ...parsed,
    expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : parsed.expiresAt,
    scheduledAt: parsed.scheduledAt ? new Date(parsed.scheduledAt) : parsed.scheduledAt,
  };
  const mission = await MysteryMission.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!mission) {
    res.status(404).json({ success: false, error: "Mission not found" });
    return;
  }
  res.json({ success: true, data: mission });
});

/** DELETE /api/admin/mystery-missions/:id */
router.delete("/mystery-missions/:id", async (req, res: Response) => {
  const { MysteryMission } = await import("../models/MysteryMission");
  await MysteryMission.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Mystery mission deleted" });
});

export default router;
