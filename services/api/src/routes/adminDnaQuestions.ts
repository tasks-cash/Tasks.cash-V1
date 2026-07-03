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

function toClientQuestionType(type: string): string {
  if (type === "short_text") return "text";
  if (type === "paragraph") return "textarea";
  return type;
}

function parseChoices(body: Record<string, unknown>): string[] | undefined {
  if (Array.isArray(body.choices)) {
    return body.choices.map(String).map((c) => c.trim()).filter(Boolean);
  }
  if (Array.isArray(body.options)) {
    return body.options.map(String).map((c) => c.trim()).filter(Boolean);
  }
  return undefined;
}

function toAdminQuestion(doc: IDNAQuestionDocument & { _id: { toString(): string } }) {
  const title = doc.title?.trim() || doc.prompt?.trim() || "Untitled question";
  return {
    id: doc._id.toString(),
    moduleId: doc.category,
    title,
    prompt: doc.prompt || title,
    questionType: toClientQuestionType(doc.answerType),
    choices: Array.isArray(doc.options) ? doc.options : [],
    required: doc.required ?? false,
    difficulty: doc.difficulty || "simple",
    xpReward: doc.xpReward ?? 5,
    bronzeCoinsReward: doc.bronzeCoinsReward ?? 1,
    silverCoinsReward: doc.silverCoinsReward ?? 0,
    goldCoinsReward: doc.goldCoinsReward ?? 0,
    enabled: doc.enabled ?? true,
    displayOrder: doc.order ?? 0,
  };
}

function buildCreatePayload(body: Record<string, unknown>) {
  const title = String(body.title ?? body.prompt ?? "").trim();
  const prompt = String(body.prompt ?? body.title ?? title).trim();
  const choices = parseChoices(body);

  return {
    title: title || prompt,
    prompt: prompt || title,
    category: String(body.moduleId ?? body.category ?? "continuous"),
    answerType: normalizeAnswerType(String(body.questionType ?? body.answerType ?? "text")),
    options: choices ?? [],
    required: Boolean(body.required),
    difficulty: String(body.difficulty ?? "simple"),
    xpReward: Number(body.xpReward ?? 5),
    bronzeCoinsReward: Number(body.bronzeCoinsReward ?? 1),
    silverCoinsReward: Number(body.silverCoinsReward ?? 0),
    goldCoinsReward: Number(body.goldCoinsReward ?? 0),
    coinReward: Number(body.coinReward ?? body.bronzeCoinsReward ?? 0),
    enabled: body.enabled !== false,
    order: Number(body.displayOrder ?? body.order ?? 0),
    unlockCondition: body.unlockCondition ? String(body.unlockCondition) : undefined,
  };
}

function applyPatch(existing: IDNAQuestionDocument, body: Record<string, unknown>) {
  if (body.title !== undefined || body.prompt !== undefined) {
    const title = String(body.title ?? body.prompt ?? existing.title ?? existing.prompt).trim();
    const prompt = String(body.prompt ?? body.title ?? title).trim();
    if (title) existing.title = title;
    if (prompt) existing.prompt = prompt;
  }
  if (body.moduleId !== undefined || body.category !== undefined) {
    existing.category = String(body.moduleId ?? body.category) as IDNAQuestionDocument["category"];
  }
  if (body.questionType !== undefined || body.answerType !== undefined) {
    existing.answerType = normalizeAnswerType(String(body.questionType ?? body.answerType));
  }
  const choices = parseChoices(body);
  if (choices !== undefined) existing.options = choices;
  if (body.required !== undefined) existing.required = Boolean(body.required);
  if (body.difficulty !== undefined) existing.difficulty = String(body.difficulty);
  if (body.xpReward !== undefined) existing.xpReward = Number(body.xpReward);
  if (body.bronzeCoinsReward !== undefined) existing.bronzeCoinsReward = Number(body.bronzeCoinsReward);
  if (body.silverCoinsReward !== undefined) existing.silverCoinsReward = Number(body.silverCoinsReward);
  if (body.goldCoinsReward !== undefined) existing.goldCoinsReward = Number(body.goldCoinsReward);
  if (body.coinReward !== undefined) existing.coinReward = Number(body.coinReward);
  if (body.enabled !== undefined) existing.enabled = Boolean(body.enabled);
  if (body.displayOrder !== undefined || body.order !== undefined) {
    existing.order = Number(body.displayOrder ?? body.order);
  }
  if (body.unlockCondition !== undefined) {
    existing.unlockCondition = body.unlockCondition ? String(body.unlockCondition) : undefined;
  }
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
    const payload = buildCreatePayload(req.body as Record<string, unknown>);
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

/** PATCH /api/admin/dna-questions/:id */
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  if (dbUnavailable(res)) return;

  const id = String(req.params.id);

  try {
    const existing = await DNAQuestion.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Question not found" });
      return;
    }

    applyPatch(existing, req.body as Record<string, unknown>);
    if (!existing.prompt?.trim()) {
      res.status(400).json({ success: false, error: "Question title is required" });
      return;
    }

    await existing.save();
    res.json({ success: true, data: toAdminQuestion(existing) });
  } catch (err) {
    console.error("[admin/dna-questions PATCH]", err);
    res.status(500).json({ success: false, error: "Failed to update DNA question" });
  }
});

/** PUT /api/admin/dna-questions/:id — full replace (legacy) */
router.put("/:id", async (req: AuthRequest, res: Response) => {
  if (dbUnavailable(res)) return;

  const id = String(req.params.id);

  try {
    const existing = await DNAQuestion.findById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: "Question not found" });
      return;
    }

    const payload = buildCreatePayload({ ...existing.toObject(), ...(req.body as Record<string, unknown>) });
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

export default router;
