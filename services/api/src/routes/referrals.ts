import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Referral } from "../models/Referral";

const router = Router();

/** GET /api/referrals — referral stats and history */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const referrals = await Referral.find({ referrerId: req.user!._id })
    .populate("referredUserId", "username createdAt level")
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
