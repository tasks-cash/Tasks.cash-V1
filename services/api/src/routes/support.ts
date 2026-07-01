import { Router, Response } from "express";
import { SupportTicket } from "../models/SupportTicket";
import { User } from "../models/User";
import { authMiddleware, requireAdmin, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
    const rows = await SupportTicket.find({ userId: req.user!._id }).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: rows.map((t) => ({
        id: String(t._id),
        userId: String(t.userId),
        subject: t.subject,
        message: t.message,
        status: t.status,
        priority: t.priority,
        updated: t.updatedAt?.toISOString?.()?.slice(0, 10) ?? "",
        createdAt: t.createdAt?.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[support] list error:", err);
    res.status(500).json({ success: false, error: "Failed to load support tickets" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
    const { subject, message, priority } = req.body ?? {};
    if (!subject || !message) {
      res.status(400).json({ success: false, error: "Subject and message are required" });
      return;
    }
    const doc = await SupportTicket.create({
      userId: req.user!._id,
      subject,
      message,
      priority: priority ?? "normal",
      status: "open",
    });
    res.status(201).json({
      success: true,
      data: {
        id: String(doc._id),
        userId: String(doc.userId),
        subject: doc.subject,
        message: doc.message,
        status: doc.status,
        priority: doc.priority,
        createdAt: doc.createdAt?.toISOString(),
      },
    });
  } catch (err) {
    console.error("[support] create error:", err);
    res.status(500).json({ success: false, error: "Failed to create support ticket" });
  }
});

router.get("/admin", requireAdmin, async (_req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
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
        createdAt: t.createdAt?.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[support] admin list error:", err);
    res.status(500).json({ success: false, error: "Failed to load support tickets" });
  }
});

export default router;
