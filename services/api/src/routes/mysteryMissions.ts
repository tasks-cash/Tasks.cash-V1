import { Router, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";
import { MysteryMission } from "../models/MysteryMission";
import type { IMysteryMissionView, MysteryPlayerState } from "@tasks-cash/types";

const router = Router();

async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }
  try {
    const token = header.slice(7);
    const secret = process.env.JWT_SECRET ?? "dev-secret";
    const payload = jwt.verify(token, secret) as { userId: string };
    req.user = await User.findById(payload.userId).select("-passwordHash") ?? undefined;
  } catch {
    /* ignore invalid token for public listing */
  }
  next();
}

function getUserMeta(user?: { level: number; xp: number; completedMissions?: unknown[]; badges?: string[] }) {
  if (!user) return undefined;
  return {
    level: user.level,
    xp: user.xp,
    completedMissions: user.completedMissions?.length ?? 0,
    referrals: 0,
    chestsOpened: 0,
    loginStreak: 0,
    isFounder: user.badges?.includes("founder") ?? false,
  };
}

function computePlayerState(
  mission: { expiresAt?: Date; isHidden: boolean; unlockCondition: string },
  userMeta?: { level?: number; xp?: number; referrals?: number; chestsOpened?: number; loginStreak?: number; completedMissions?: number; isFounder?: boolean }
): { playerState: MysteryPlayerState; isRevealed: boolean } {
  if (mission.expiresAt && new Date(mission.expiresAt) < new Date()) {
    return { playerState: "expired", isRevealed: true };
  }

  const unlocked = checkUnlock(mission.unlockCondition, userMeta);
  if (!unlocked) {
    return { playerState: "locked", isRevealed: false };
  }

  return { playerState: "unlocked", isRevealed: true };
}

function checkUnlock(
  condition: string,
  userMeta?: { level?: number; xp?: number; referrals?: number; chestsOpened?: number; loginStreak?: number; completedMissions?: number; isFounder?: boolean }
): boolean {
  if (condition === "none") return true;
  if (!userMeta) return false;

  switch (condition) {
    case "level_5": return (userMeta.level ?? 0) >= 5;
    case "level_10": return (userMeta.level ?? 0) >= 10;
    case "invite_3_friends": return (userMeta.referrals ?? 0) >= 3;
    case "first_mission": return (userMeta.completedMissions ?? 0) >= 1;
    case "earn_1000_xp": return (userMeta.xp ?? 0) >= 1000;
    case "open_3_chests": return (userMeta.chestsOpened ?? 0) >= 3;
    case "login_7_days": return (userMeta.loginStreak ?? 0) >= 7;
    case "founder": return !!userMeta.isFounder;
    case "special_event": return false;
    default: return false;
  }
}

/** GET /api/mystery-missions */
router.get("/", optionalAuth, async (req: AuthRequest, res: Response) => {
  const category = req.query.category as string | undefined;
  const filter: Record<string, unknown> = { isActive: true };
  if (category && category !== "all") filter.category = category;

  const missions = await MysteryMission.find(filter).sort({ isFeatured: -1, createdAt: -1 });
  const userMeta = getUserMeta(req.user ?? undefined);

  const data: IMysteryMissionView[] = missions.map((m) => {
    const { playerState, isRevealed } = computePlayerState(m, userMeta);
    const doc = m.toObject();
    return {
      ...doc,
      _id: String(doc._id),
      playerState,
      isRevealed: isRevealed || !doc.isHidden,
    };
  });

  res.json({ success: true, data });
});

/** GET /api/mystery-missions/:id */
router.get("/:id", optionalAuth, async (req: AuthRequest, res: Response) => {
  const mission = await MysteryMission.findById(req.params.id);
  if (!mission || !mission.isActive) {
    res.status(404).json({ success: false, error: "Mission not found" });
    return;
  }

  const userMeta = getUserMeta(req.user ?? undefined);
  const { playerState, isRevealed } = computePlayerState(mission, userMeta);
  const doc = mission.toObject();

  res.json({
    success: true,
    data: {
      ...doc,
      _id: String(doc._id),
      playerState,
      isRevealed: isRevealed || !doc.isHidden,
    },
  });
});

/** POST /api/mystery-missions/:id/start — mark in progress (optional auth) */
router.post("/:id/start", authMiddleware, async (req: AuthRequest, res: Response) => {
  const mission = await MysteryMission.findById(req.params.id);
  if (!mission) {
    res.status(404).json({ success: false, error: "Mission not found" });
    return;
  }
  res.json({ success: true, data: { playerState: "in_progress" as MysteryPlayerState } });
});

export default router;

/** Admin mystery mission schema */
export const mysteryMissionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard", "epic", "legendary"]).default("medium"),
  category: z.enum([
    "daily", "weekly", "monthly", "special", "community", "referral",
    "video", "social_media", "ai", "hidden", "legendary", "founder",
  ]),
  missionType: z.enum([
    "video_submission", "social_share", "telegram_join", "discord_join",
    "instagram_follow", "facebook_follow", "youtube_subscribe",
    "invite_friends", "complete_profile", "website_visit",
    "daily_login", "special_event", "manual_review",
  ]),
  unlockCondition: z.enum([
    "none", "level_5", "level_10", "invite_3_friends", "first_mission",
    "earn_1000_xp", "open_3_chests", "login_7_days", "founder", "special_event",
  ]).default("none"),
  unlockLabel: z.string().optional(),
  rewards: z.array(z.object({
    type: z.string(),
    amount: z.number().optional(),
    label: z.string().optional(),
  })).default([]),
  xpReward: z.number().nonnegative().default(0),
  coinReward: z.number().nonnegative().default(0),
  coinType: z.enum(["bronze", "silver", "gold"]).default("gold"),
  isHidden: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  maxCompletions: z.number().positive().optional(),
});
