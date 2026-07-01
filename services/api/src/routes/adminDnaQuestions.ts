import { Router, Response } from "express";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import { isDbConnected } from "../config/database";
import { DNAQuestion, type IDNAQuestionDocument } from "../models/DNAQuestion";
import type { DNAQuestionType } from "@tasks-cash/types";

const router = Router();

router.use(authMiddleware, adminMiddleware);

const ANSWER_TYPES: DNAQuestionType[] = [
  "text",
  "country",
  "number",
  "time",
  "textarea",
  "short_text",
  "paragraph",
  "single_choice",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "image_upload",
  "slider",
  "rating",
  "date",
  "file_upload",
];

function dbUnavailable(res: Response): boolean {
  if (!isDbConnected()) {
    res.status(503).json({ success: false, error: "Database unavailable" });
    return true;
  }
  return false;
}

function normalizeAnswerType(type?: string): DNAQuestionType {
  const value = (type || "text").toLowerCase();
  const aliases: Record<string, DNAQuestionType> = {
    text: "short_text",
    textarea: "paragraph",
  };
  const resolved = aliases[value] ?? value;
  return ANSWER_TYPES.includes(resolved as DNAQuestionType) ? (resolved as DNAQuestionType) : "short_text";
}

function toClientAnswerType(type: string): string {
  if (type === "short_text") return "text";
  if (type === "paragraph") return "textarea";
  return type;
}

function toAdminQuestion(doc: IDNAQuestionDocument & { _id: { toString(): string } }) {
  return {
    id: doc._id.toString(),
    title: doc.prompt,
    prompt: doc.prompt,
    moduleId: doc.category,
    category: doc.category,
    questionType: toClientAnswerType(doc.answerType),
    answerType: toClientAnswerType(doc.answerType),
    difficulty: "simple",
    options: doc.options ?? [],
    xpReward: doc.xpReward,
    coinReward: doc.coinReward,
    enabled: doc.enabled,
    order: doc.order,
    displayOrder: doc.order,
    unlockCondition: doc.unlockCondition,
  };
}

function buildPayload(body: Record<string, unknown>) {
  const prompt = String(body.title ?? body.prompt ?? "").trim();
  const category = String(body.moduleId ?? body.category ?? "continuous");
  const answerType = normalizeAnswerType(String(body.questionType ?? body.answerType ?? "text"));

  return {
    prompt,
    category,
    answerType,
    options: Array.isArray(body.options) ? body.options.map(String) : undefined,
    xpReward: Number(body.xpReward ?? 50),
    coinReward: Number(body.coinReward ?? 0),
    enabled: body.enabled !== false,
    order: Number(body.displayOrder ?? body.order ?? 0),
    unlockCondition: body.unlockCondition ? String(body.unlockCondition) : undefined,
  };
}

/** GET /api/admin/dna-questions */
router.get("/", async (_req: AuthRequest, res: Response) => {
  if (dbUnavailable(res)) return;

  try {
    const docs = await DNAQuestion.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: docs.map((doc) => toAdminQuestion(doc)) });
  } catch (err) {
    console.error("[admin/dna-questions GET]", err);
    res.status(500).json({ success: false, error: "Failed to load DNA questions" });
  }
});

/** POST /api/admin/dna-questions */
router.post("/", async (req: AuthRequest, res: Response) => {
  if (dbUnavailable(res)) return;

  try {
    const payload = buildPayload(req.body as Record<string, unknown>);
    if (!payload.prompt) {
      res.status(400).json({ success: false, error: "Question title is required" });
      return;
    }

    if (!payload.order) {
      payload.order = (await DNAQuestion.countDocuments()) + 1;
    }

    const doc = await DNAQuestion.create(payload);
    res.status(201).json({ success: true, data: toAdminQuestion(doc) });
  } catch (err) {
    console.error("[admin/dna-questions POST]", err);
    res.status(500).json({ success: false, error: "Failed to create DNA question" });
  }
});

/** PUT /api/admin/dna-questions/:id */
router.put("/:id", async (req: AuthRequest, res: Response) => {
  if (dbUnavailable(res)) return;

  const id = String(req.params.id);

  try {
    const existing = await DNAQuestion.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Question not found" });
      return;
    }

    const payload = buildPayload({ ...existing.toObject(), ...(req.body as Record<string, unknown>) });
    if (!payload.prompt) {
      res.status(400).json({ success: false, error: "Question title is required" });
      return;
    }

    existing.set(payload);
    await existing.save();
    res.json({ success: true, data: toAdminQuestion(existing) });
  } catch (err) {
    console.error("[admin/dna-questions PUT]", err);
    res.status(500).json({ success: false, error: "Failed to update DNA question" });
  }
});

/** DELETE /api/admin/dna-questions/:id */
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  if (dbUnavailable(res)) return;

  const id = String(req.params.id);

  try {
    const deleted = await DNAQuestion.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Question not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("[admin/dna-questions DELETE]", err);
    res.status(500).json({ success: false, error: "Failed to delete DNA question" });
  }
});

/** POST /api/admin/dna-questions/reorder */
router.post("/reorder", async (req: AuthRequest, res: Response) => {
  if (dbUnavailable(res)) return;

  const { orderedIds } = req.body as { orderedIds?: string[] };
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ success: false, error: "orderedIds array required" });
    return;
  }

  try {
    await Promise.all(
      orderedIds.map((questionId, index) =>
        DNAQuestion.findByIdAndUpdate(questionId, { order: index + 1 })
      )
    );
    const docs = await DNAQuestion.find().sort({ order: 1, createdAt: 1 });
    res.json({ success: true, data: docs.map((doc) => toAdminQuestion(doc)) });
  } catch (err) {
    console.error("[admin/dna-questions reorder]", err);
    res.status(500).json({ success: false, error: "Failed to reorder DNA questions" });
  }
});

export default router;
