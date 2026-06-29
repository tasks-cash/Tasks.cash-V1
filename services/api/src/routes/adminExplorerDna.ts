import { Router, Response } from "express";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import type { IDNAQuestion } from "@tasks-cash/types";
import {
  deleteQuestion,
  listQuestions,
  replaceQuestions,
  upsertQuestion,
} from "../lib/explorerDnaStore";

const router = Router();

router.use(authMiddleware, adminMiddleware);

/** GET /api/admin/explorer-dna/questions */
router.get("/questions", async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: listQuestions() });
});

/** POST /api/admin/explorer-dna/questions */
router.post("/questions", async (req: AuthRequest, res: Response) => {
  const body = req.body as Partial<IDNAQuestion>;
  const question: IDNAQuestion = {
    id: body.id ?? `q_${Date.now()}`,
    prompt: body.prompt ?? "",
    category: body.category ?? "continuous",
    answerType: body.answerType ?? "single_choice",
    options: body.options,
    xpReward: body.xpReward ?? 50,
    coinReward: body.coinReward ?? 0,
    enabled: body.enabled ?? true,
    order: body.order ?? listQuestions().length + 1,
    unlockCondition: body.unlockCondition,
  };

  if (!question.prompt.trim()) {
    res.status(400).json({ success: false, message: "Question prompt is required" });
    return;
  }

  const saved = upsertQuestion(question);
  res.status(201).json({ success: true, data: saved });
});

/** PUT /api/admin/explorer-dna/questions/:id */
router.put("/questions/:id", async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const existing = listQuestions().find((q) => q.id === id);
  if (!existing) {
    res.status(404).json({ success: false, message: "Question not found" });
    return;
  }

  const updated = upsertQuestion({ ...existing, ...req.body, id: existing.id });
  res.json({ success: true, data: updated });
});

/** DELETE /api/admin/explorer-dna/questions/:id */
router.delete("/questions/:id", async (req: AuthRequest, res: Response) => {
  const ok = deleteQuestion(String(req.params.id));
  if (!ok) {
    res.status(404).json({ success: false, message: "Question not found" });
    return;
  }
  res.json({ success: true });
});

/** POST /api/admin/explorer-dna/questions/reorder — bulk reorder */
router.post("/questions/reorder", async (req: AuthRequest, res: Response) => {
  const { orderedIds } = req.body as { orderedIds?: string[] };
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, message: "orderedIds array required" });
    return;
  }

  const current = listQuestions();
  const reordered = orderedIds
    .map((id, index) => {
      const q = current.find((item) => item.id === id);
      return q ? { ...q, order: index + 1 } : null;
    })
    .filter(Boolean) as IDNAQuestion[];

  const missing = current.filter((q) => !orderedIds.includes(q.id));
  replaceQuestions([...reordered, ...missing.map((q, i) => ({ ...q, order: reordered.length + i + 1 }))]);
  res.json({ success: true, data: listQuestions() });
});

export default router;
