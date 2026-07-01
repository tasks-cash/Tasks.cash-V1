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

/** GET /api/admin/referrals */
router.get("/referrals", async (_req, res: Response) => {
  const { listAdminReferrals } = await import("../services/referralService");
  const data = await listAdminReferrals();
  res.json({ success: true, data });
});

/** PATCH /api/admin/referrals/:id/status */
router.patch("/referrals/:id/status", async (req, res: Response) => {
  const schema = z.object({
    status: z.enum(["pending", "active", "rewarded", "rejected"]),
    adminNote: z.string().optional(),
  });
  const { status, adminNote } = schema.parse(req.body);
  const { updateReferralStatus } = await import("../services/referralService");
  const updated = await updateReferralStatus(String(req.params.id), status, adminNote);
  if (!updated) {
    res.status(404).json({ success: false, error: "Referral not found" });
    return;
  }
  res.json({ success: true, data: updated });
});

/** GET /api/admin/video-submissions */
router.get("/video-submissions", async (_req, res: Response) => {
  const { listAllVideoSubmissions } = await import("../services/videoSubmissionService");
  const data = await listAllVideoSubmissions();
  res.json({ success: true, data });
});

/** PATCH /api/admin/video-submissions/:id/approve */
router.patch("/video-submissions/:id/approve", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    adminResponse: z.string().optional(),
    rewardXp: z.number().optional(),
    bronzeCoins: z.number().optional(),
    silverCoins: z.number().optional(),
    goldCoins: z.number().optional(),
    diamondGems: z.number().optional(),
  });
  const payload = schema.parse(req.body);
  const { approveVideoSubmission } = await import("../services/videoSubmissionService");
  const updated = await approveVideoSubmission(String(req.params.id), req.user!._id.toString(), payload);
  if (!updated) {
    res.status(404).json({ success: false, error: "Submission not found" });
    return;
  }
  res.json({ success: true, data: updated });
});

/** PATCH /api/admin/video-submissions/:id/reject */
router.patch("/video-submissions/:id/reject", async (req: AuthRequest, res: Response) => {
  const schema = z.object({ adminResponse: z.string().min(1) });
  const { adminResponse } = schema.parse(req.body);
  const { rejectVideoSubmission } = await import("../services/videoSubmissionService");
  const updated = await rejectVideoSubmission(String(req.params.id), req.user!._id.toString(), adminResponse);
  if (!updated) {
    res.status(404).json({ success: false, error: "Submission not found" });
    return;
  }
  res.json({ success: true, data: updated });
});

/** GET /api/admin/employees */
router.get("/employees", async (_req, res: Response) => {
  const { Employee } = await import("../models/Employee");
  const rows = await Employee.find().sort({ createdAt: -1 }).lean();
  const userIds = rows.map((e) => e.userId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } }).select("username email role").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  res.json({
    success: true,
    data: rows.map((e) => {
      const user = userMap.get(String(e.userId));
      return {
        id: String(e._id),
        name: user?.username ?? "—",
        email: user?.email ?? "",
        role: user?.role ?? e.position ?? "—",
        department: e.department,
        status: e.isActive ? "active" : "inactive",
      };
    }),
  });
});

/** GET /api/admin/withdrawals */
router.get("/withdrawals", async (_req, res: Response) => {
  const { Withdrawal } = await import("../models/Withdrawal");
  const rows = await Withdrawal.find().sort({ createdAt: -1 }).lean();
  const userIds = [...new Set(rows.map((w) => String(w.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("username").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u.username]));
  res.json({
    success: true,
    data: rows.map((w) => ({
      id: String(w._id),
      user: userMap.get(String(w.userId)) ?? "—",
      amount: w.amount,
      method: w.method,
      status: w.status,
      date: w.createdAt?.toISOString?.()?.slice(0, 10) ?? "",
    })),
  });
});

/** GET /api/admin/support-tickets */
router.get("/support-tickets", async (_req, res: Response) => {
  const { SupportTicket } = await import("../models/SupportTicket");
  const rows = await SupportTicket.find().sort({ createdAt: -1 }).lean();
  const userIds = [...new Set(rows.map((t) => String(t.userId)))];
  const users = await User.find({ _id: { $in: userIds } }).select("username").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u.username]));
  res.json({
    success: true,
    data: rows.map((t) => ({
      id: String(t._id),
      user: userMap.get(String(t.userId)) ?? "—",
      subject: t.subject,
      priority: t.priority,
      status: t.status,
    })),
  });
});

/** GET /api/admin/challenges */
router.get("/challenges", async (_req, res: Response) => {
  const { Challenge } = await import("../models/Challenge");
  const rows = await Challenge.find().sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    data: rows.map((c) => ({
      id: String(c._id),
      title: c.title,
      participants: 0,
      status: c.isActive ? "active" : "scheduled",
      ends: c.endsAt?.toISOString?.()?.slice(0, 10) ?? "",
    })),
  });
});

/** GET /api/admin/treasures */
router.get("/treasures", async (_req, res: Response) => {
  const { Treasure } = await import("../models/Treasure");
  const rows = await Treasure.find().sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    data: rows.map((t) => ({
      id: String(t._id),
      name: t.name,
      rarity: t.rarity,
      unlocked: 0,
    })),
  });
});

/** GET /api/admin/levels */
router.get("/levels", async (_req, res: Response) => {
  const { Level } = await import("../models/Level");
  const rows = await Level.find().sort({ level: 1 }).lean();
  res.json({
    success: true,
    data: rows.map((l) => ({
      id: String(l._id),
      level: l.level,
      title: l.title,
      xpRequired: l.xpRequired,
      reward: l.perks?.[0] ?? "",
    })),
  });
});

/** GET /api/admin/notifications */
router.get("/notifications", async (_req, res: Response) => {
  const { Notification } = await import("../models/Notification");
  const rows = await Notification.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({
    success: true,
    data: rows.map((n) => ({
      id: String(n._id),
      title: n.title,
      audience: "User",
      sent: n.createdAt?.toISOString?.()?.slice(0, 10) ?? "",
      status: n.read ? "delivered" : "pending",
    })),
  });
});

/** GET /api/admin/leaderboards */
router.get("/leaderboards", async (_req, res: Response) => {
  const { Leaderboard } = await import("../models/Leaderboard");
  const rows = await Leaderboard.find().sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    data: rows.map((lb) => ({
      id: String(lb._id),
      season: lb.name,
      leader: (lb.entries?.[0] as { username?: string })?.username ?? "—",
      participants: Array.isArray(lb.entries) ? lb.entries.length : 0,
      status: lb.isActive ? "active" : "completed",
    })),
  });
});

/** GET /api/admin/roles */
router.get("/roles", async (_req, res: Response) => {
  const { Role } = await import("../models/Role");
  const rows = await Role.find().sort({ createdAt: -1 }).lean();
  res.json({
    success: true,
    data: rows.map((r) => ({
      id: String(r._id),
      name: r.name,
      permissions: Array.isArray(r.permissions) ? r.permissions.length : 0,
      users: 0,
    })),
  });
});

/** GET /api/admin/permissions */
router.get("/permissions", async (_req, res: Response) => {
  const { Permission } = await import("../models/Permission");
  const { Role } = await import("../models/Role");
  const [permissions, roles] = await Promise.all([
    Permission.find().sort({ name: 1 }).lean(),
    Role.find().lean(),
  ]);
  res.json({
    success: true,
    data: permissions.map((p) => ({
      id: String(p._id),
      name: p.slug ?? p.name,
      category: p.name?.split(".")?.[0] ?? "General",
      roles: roles.filter((r) => Array.isArray(r.permissions) && r.permissions.includes(p.slug ?? p.name)).length,
    })),
  });
});

/** GET /api/admin/audit-logs */
router.get("/audit-logs", async (_req, res: Response) => {
  const { AuditLog } = await import("../models/AuditLog");
  const rows = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
  const actorIds = [...new Set(rows.map((a) => String(a.actorId)))];
  const actors = await User.find({ _id: { $in: actorIds } }).select("username").lean();
  const actorMap = new Map(actors.map((u) => [String(u._id), u.username]));
  res.json({
    success: true,
    data: rows.map((a) => ({
      id: String(a._id),
      action: a.action,
      actor: actorMap.get(String(a.actorId)) ?? "—",
      target: a.resource,
      time: a.createdAt?.toISOString?.()?.slice(0, 16) ?? "",
    })),
  });
});

export default router;
