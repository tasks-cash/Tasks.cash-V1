import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Referral } from "../models/Referral";
import { User } from "../models/User";
import { getLevelTitle, xpProgress } from "@tasks-cash/utils";
import { buildPlayerProfile } from "../services/gameService";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

/** GET /api/users/dashboard — aggregated dashboard stats */
router.get("/dashboard", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  const user = req.user!;
  const baseXp = Number(process.env.XP_PER_LEVEL ?? 1000);
  const progress = xpProgress(user.xp, baseXp);
  const referralCount = await Referral.countDocuments({ referrerId: user._id });
  const rank = await User.countDocuments({ xp: { $gt: user.xp } }) + 1;

  let profile;
  try {
    profile = await buildPlayerProfile(user);
  } catch {
    profile = null;
  }

  res.json({
    success: true,
    data: {
      coins: user.coins,
      xp: user.xp,
      level: progress.level,
      levelTitle: getLevelTitle(progress.level),
      xpToNextLevel: progress.xpToNextLevel,
      xpProgress: progress.progress,
      completedMissions: user.completedMissions.length,
      rank,
      referralCount,
      referralCode: user.referralCode,
      badges: user.badges,
      currencies: user.currencies,
      rpgStats: user.rpgStats,
      explorerRank: user.explorerRank,
      playerTitle: user.playerTitle,
      achievements: user.achievements,
      streakDays: user.streakDays,
      dailyRewardAvailable: profile?.dailyRewardAvailable ?? false,
      profile,
    },
  });
});

/** GET /api/users/wallet — coin balance + recent transactions */
router.get("/wallet", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  const { Transaction } = await import("../models/Transaction");
  const transactions = await Transaction.find({ userId: req.user!._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: {
      balance: req.user!.coins,
      currencies: req.user!.currencies,
      transactions,
    },
  });
});

/** GET /api/users/referrals */
router.get("/referrals", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  const referrals = await Referral.find({ referrerId: req.user!._id })
    .populate("referredUserId", "username createdAt")
    .sort({ createdAt: -1 });

  const totalBonus = referrals.reduce((sum, r) => sum + r.bonusCoins, 0);

  res.json({
    success: true,
    data: {
      referralCode: req.user!.referralCode,
      totalReferrals: referrals.length,
      totalBonus,
      referrals,
    },
  });
});

export default router;
