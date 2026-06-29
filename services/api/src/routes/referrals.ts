import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
  getReferralHistory,
  getReferralMe,
  validateReferralCode,
} from "../services/referralService";

const router = Router();

/** Legacy GET /api/referrals */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const data = await getReferralMe(req.user!._id.toString(), req.user!.referralCode);
  res.json({ success: true, data });
});

/** GET /api/referrals/me */
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  const data = await getReferralMe(req.user!._id.toString(), req.user!.referralCode);
  res.json({ success: true, data });
});

/** GET /api/referrals/history */
router.get("/history", authMiddleware, async (req: AuthRequest, res: Response) => {
  const history = await getReferralHistory(req.user!._id.toString());
  res.json({ success: true, data: history });
});

/** POST /api/referrals/validate-code */
router.post("/validate-code", async (req, res: Response) => {
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
