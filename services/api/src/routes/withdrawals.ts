import { Router, Response } from "express";
import { Withdrawal } from "../models/Withdrawal";
import { User } from "../models/User";
import { authMiddleware, requireAdmin, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
    const rows = await Withdrawal.find({ userId: req.user!._id }).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: rows.map((w) => ({
        id: String(w._id),
        userId: String(w.userId),
        amount: w.amount,
        method: w.method,
        status: w.status,
        processedAt: w.processedAt?.toISOString?.() ?? w.processedAt,
        createdAt: w.createdAt?.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[withdrawals] list error:", err);
    res.status(500).json({ success: false, error: "Failed to load withdrawals" });
  }
});

router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
    const { amount, method } = req.body ?? {};
    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ success: false, error: "Invalid amount" });
      return;
    }
    const doc = await Withdrawal.create({
      userId: req.user!._id,
      amount,
      method: method ?? "bank",
      status: "pending",
    });
    res.status(201).json({
      success: true,
      data: {
        id: String(doc._id),
        userId: String(doc.userId),
        amount: doc.amount,
        method: doc.method,
        status: doc.status,
        createdAt: doc.createdAt?.toISOString(),
      },
    });
  } catch (err) {
    console.error("[withdrawals] create error:", err);
    res.status(500).json({ success: false, error: "Failed to create withdrawal request" });
  }
});

router.get("/admin", requireAdmin, async (_req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
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
        createdAt: w.createdAt?.toISOString(),
      })),
    });
  } catch (err) {
    console.error("[withdrawals] admin list error:", err);
    res.status(500).json({ success: false, error: "Failed to load withdrawals" });
  }
});

export default router;
