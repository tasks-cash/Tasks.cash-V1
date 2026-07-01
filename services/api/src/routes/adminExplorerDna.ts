import { Router, Response } from "express";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { isDbConnected } from "../config/database";
import type { IDNAQuestion } from "@tasks-cash/types";
import {
  deleteQuestion,
  listQuestions,
  replaceQuestions,
  upsertQuestion,
} from "../services/explorerDnaService";

const router = Router();

router.use(authMiddleware, adminMiddleware);

function dbError(res: Response): void {
  res.status(503).json({ success: false, error: "Database unavailable" });
}

/** GET /api/admin/explorer-dna/questions */
router.get("/questions", async (_req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    dbError(res);
    return;
  }

  try {
    const data = await listQuestions();
    res.json({ success: true, data });
  } catch (err) {
    console.error("[admin explorer-dna GET /questions]", err);
    res.status(500).json({ success: false, error: "Failed to load DNA questions" });
  }
});

/** POST /api/admin/explorer-dna/questions */
router.post("/questions", async (req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    dbError(res);
    return;
  }

  const body = req.body as Partial<IDNAQuestion>;
  const question: IDNAQuestion = {
    id: body.id ?? "",
    prompt: body.prompt ?? "",
    category: body.category ?? "continuous",
    answerType: body.answerType ?? "single_choice",
    options: body.options,
    xpReward: body.xpReward ?? 50,
    coinReward: body.coinReward ?? 0,
    enabled: body.enabled ?? true,
    order: body.order ?? 0,
    unlockCondition: body.unlockCondition,
  };

  if (!question.prompt.trim()) {
    res.status(400).json({ success: false, message: "Question prompt is required" });
    return;
  }

  try {
    if (!question.order) {
      const existing = await listQuestions();
      question.order = existing.length + 1;
    }
    const saved = await upsertQuestion(question);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error("[admin explorer-dna POST /questions]", err);
    res.status(500).json({ success: false, error: "Failed to save DNA question" });
  }
});

/** PUT /api/admin/explorer-dna/questions/:id */
router.put("/questions/:id", async (req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    dbError(res);
    return;
  }

  const id = String(req.params.id);

  try {
    const existing = (await listQuestions()).find((q) => q.id === id);
    if (!existing) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }

    const updated = await upsertQuestion({ ...existing, ...req.body, id: existing.id });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("[admin explorer-dna PUT /questions/:id]", err);
    res.status(500).json({ success: false, error: "Failed to update DNA question" });
  }
});

/** DELETE /api/admin/explorer-dna/questions/:id */
router.delete("/questions/:id", async (req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    dbError(res);
    return;
  }

  try {
    const ok = await deleteQuestion(String(req.params.id));
    if (!ok) {
      res.status(404).json({ success: false, message: "Question not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[admin explorer-dna DELETE /questions/:id]", err);
    res.status(500).json({ success: false, error: "Failed to delete DNA question" });
  }
});

/** POST /api/admin/explorer-dna/questions/reorder — bulk reorder */
router.post("/questions/reorder", async (req: AuthRequest, res: Response) => {
  if (!isDbConnected()) {
    dbError(res);
    return;
  }

  const { orderedIds } = req.body as { orderedIds?: string[] };
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, message: "orderedIds array required" });
    return;
  }

  try {
    const current = await listQuestions();
    const reordered = orderedIds
      .map((id, index) => {
        const q = current.find((item) => item.id === id);
        return q ? { ...q, order: index + 1 } : null;
      })
      .filter(Boolean) as IDNAQuestion[];

    const missing = current.filter((q) => !orderedIds.includes(q.id));
    const data = await replaceQuestions([
      ...reordered,
      ...missing.map((q, i) => ({ ...q, order: reordered.length + i + 1 })),
    ]);

    res.json({ success: true, data });
  } catch (err) {
    console.error("[admin explorer-dna POST /questions/reorder]", err);
    res.status(500).json({ success: false, error: "Failed to reorder DNA questions" });
  }
});

export default router;
