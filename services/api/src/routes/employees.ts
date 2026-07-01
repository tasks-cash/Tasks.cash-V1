import { Router, Response } from "express";
import { Employee } from "../models/Employee";
import { User } from "../models/User";
import { requireAdmin, AuthRequest } from "../middleware/auth";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

router.get("/", requireAdmin, async (_req: AuthRequest, res: Response) => {
  if (!(await requireDbConnection(res))) return;
  try {
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
  } catch (err) {
    console.error("[employees] list error:", err);
    res.status(500).json({ success: false, error: "Failed to load employees" });
  }
});

export default router;
