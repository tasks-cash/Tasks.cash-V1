import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { getUserDnaData, submitDnaAnswer } from "../lib/explorerDnaStore";

const router = Router();

/** GET /api/explorer-dna/me — full Explorer DNA payload */
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id ?? req.user?._id ?? "anonymous";
  res.json({ success: true, data: getUserDnaData(String(userId)) });
});

/** POST /api/explorer-dna/answers — submit a DNA question answer */
router.post("/answers", authenticate, async (req: AuthRequest, res: Response) => {
  const { questionId, value } = req.body as { questionId?: string; value?: unknown };
  if (!questionId || value === undefined) {
    res.status(400).json({ success: false, message: "questionId and value required" });
    return;
  }

  const userId = req.user?.id ?? req.user?._id ?? "anonymous";
  const result = submitDnaAnswer(String(userId), questionId, value as string | string[] | number);

  if (!result) {
    res.status(404).json({ success: false, message: "Question not found or already answered" });
    return;
  }

  res.json({
    success: true,
    data: {
      answerId: result.answer.id,
      questionId,
      value,
      xpAwarded: result.xpAwarded,
      coinsAwarded: result.coinsAwarded,
      completionDelta: result.completionDelta,
      intelligenceDelta: result.intelligenceDelta,
      profile: getUserDnaData(String(userId)).profile,
    },
  });
});

export default router;
