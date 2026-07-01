import { Router, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { User } from "../models/User";
import { cacheGet, cacheSet, cacheDel } from "../config/redis";
import { RedisKeys } from "@tasks-cash/utils";
import type { ILeaderboardEntry } from "@tasks-cash/types";

const router = Router();

async function buildLeaderboard(limit: number, period: string): Promise<ILeaderboardEntry[]> {
  const cacheKey = RedisKeys.leaderboard(period);
  const cached = await cacheGet<ILeaderboardEntry[]>(cacheKey);
  if (cached) return cached.slice(0, limit);

  const users = await User.find({ role: "user" })
    .select("username xp coins level completedMissions")
    .sort({ xp: -1 })
    .limit(limit);

  const entries: ILeaderboardEntry[] = users.map((u, i) => ({
    rank: i + 1,
    userId: u._id.toString(),
    username: u.username,
    level: u.level,
    xp: u.xp,
    coins: u.coins,
    completedMissions: u.completedMissions.length,
  }));

  await cacheSet(cacheKey, entries, 60);
  return entries;
}

/** GET /api/leaderboard/public — no auth required */
router.get("/public", async (req, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const period = (req.query.period as string) ?? "all";
    const entries = await buildLeaderboard(limit, period);
    res.json({ success: true, data: entries });
  } catch (err) {
    console.error("[leaderboard] public error:", err);
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
});

/** GET /api/leaderboard */
router.get("/", authMiddleware, async (req, res: Response) => {
  const period = (req.query.period as string) ?? "all";
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  try {
    const entries = await buildLeaderboard(limit, period);
    res.json({ success: true, data: entries });
  } catch (err) {
    console.error("[leaderboard] error:", err);
    res.status(500).json({ success: false, error: "Failed to load leaderboard" });
  }
});

/** POST /api/leaderboard/invalidate — admin cache bust */
router.post("/invalidate", authMiddleware, async (_req, res: Response) => {
  await cacheDel(RedisKeys.leaderboard("all"));
  res.json({ success: true, message: "Leaderboard cache cleared" });
});

export default router;
