import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
  getReferralHistory,
  getReferralLeaderboards,
  getReferralMe,
  validateReferralCode,
} from "../services/referralService";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

/** Legacy GET /api/referrals */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;
  const data = await getReferralMe(req.user!._id.toString(), req.user!.referralCode);
  res.json({ success: true, data });
});

/** GET /api/referrals/me */
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;
  try {
    const data = await getReferralMe(req.user!._id.toString(), req.user!.referralCode);
    res.json({ success: true, data });
  } catch (err) {
    console.error("[referrals/me]", err);
    res.status(500).json({ success: false, error: "Failed to load referral profile" });
  }
});

/** GET /api/referrals/history */
router.get("/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;
  try {
    const history = await getReferralHistory(req.user!._id.toString());
    res.json({ success: true, data: history });
  } catch (err) {
    console.error("[referrals/history]", err);
    res.status(500).json({ success: false, error: "Failed to load referral history" });
  }
});

/** GET /api/referrals/leaderboards */
router.get("/leaderboards", authMiddleware, async (_req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;
  try {
    const data = await getReferralLeaderboards();
    res.json({ success: true, data });
  } catch (err) {
    console.error("[referrals/leaderboards]", err);
    res.json({
      success: true,
      data: { daily: [], weekly: [], monthly: [] },
    });
  }
});

/** POST /api/referrals/validate-code */
router.post("/validate-code", async (req, res: Response) => {
  if (!requireDbConnection(res)) return;
  try {
    const schema = z.object({
      code: z.string().min(2),
      selfReferralCode: z.string().optional(),
    });
    const { code, selfReferralCode } = schema.parse(req.body);
    const result = await validateReferralCode(code, selfReferralCode);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Validation failed" });
  }
});

export default router;
