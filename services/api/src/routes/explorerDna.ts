import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth";
import { isDbConnected } from "../config/database";
import { getUserDnaData, submitDnaAnswer } from "../services/explorerDnaService";

const router = Router();

/** GET /api/explorer-dna/me — full Explorer DNA payload */
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    res.status(503).json({ success: false, error: "Database unavailable" });
    return;
  }

  try {
    const userId = String(req.user?.id ?? req.user?._id ?? "");
    const data = await getUserDnaData(userId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("[explorer-dna GET /me]", err);
    res.status(500).json({ success: false, error: "Failed to load Explorer DNA" });
  }
});

/** POST /api/explorer-dna/answers — submit a DNA question answer */
router.post("/answers", authenticate, async (req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    res.status(503).json({ success: false, error: "Database unavailable" });
    return;
  }

  const { questionId, value } = req.body as { questionId?: string; value?: unknown };
  if (!questionId || value === undefined) {
    res.status(400).json({ success: false, message: "questionId and value required" });
    return;
  }

  try {
    const userId = String(req.user?.id ?? req.user?._id ?? "");
    const result = await submitDnaAnswer(userId, questionId, value as string | string[] | number);

    if (!result) {
      res.status(404).json({ success: false, message: "Question not found or already answered" });
      return;
    }

    const profile = (await getUserDnaData(userId)).profile;

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
        profile,
      },
    });
  } catch (err) {
    console.error("[explorer-dna POST /answers]", err);
    res.status(500).json({ success: false, error: "Failed to submit DNA answer" });
  }
});

export default router;
