import mongoose from "mongoose";
import type {
  ExplorerDNAData,
  ExplorerDNAProfile,
  IDNAModule,
  IDNAAnswer,
  IDNAQuestion,
  IDNARecommendation,
} from "@tasks-cash/types";
import { isDbConnected } from "../config/database";
import { DNAQuestion, DNAModule, DNAAnswer, DNARecommendation } from "../models";
import type { IDNAQuestionDocument } from "../models/DNAQuestion";
import type { IDNAModuleDocument } from "../models/DNAModule";
import type { IDNAAnswerDocument } from "../models/DNAAnswer";
import type { IDNARecommendationDocument } from "../models/DNARecommendation";

type AnswerValue = string | string[] | number;

function emptyProfile(): ExplorerDNAProfile {
  return {
    completionPercent: 0,
    completedModules: 0,
    totalModules: 0,
    intelligenceScore: 0,
    nextReward: "",
    pendingQuestions: 0,
    totalXpEarned: 0,
    badges: [],
  };
}

function emptyExplorerData(): ExplorerDNAData {
  return {
    profile: emptyProfile(),
    modules: [],
    questions: [],
    answers: [],
    matchScores: [],
    recommendations: [],
  };
}

function toQuestion(doc: IDNAQuestionDocument): IDNAQuestion {
  return {
    id: String(doc._id),
    prompt: doc.prompt,
    category: doc.category,
    answerType: doc.answerType,
    options: doc.options,
    xpReward: doc.xpReward,
    coinReward: doc.coinReward,
    enabled: doc.enabled,
    order: doc.order,
    unlockCondition: doc.unlockCondition,
  };
}

function toModule(doc: IDNAModuleDocument): IDNAModule {
  const fields = (doc.fields ?? []).map((field) => ({
    id: field.id,
    label: field.label,
    completed: field.completed,
  }));
  const totalFields = fields.length;
  const completedFields = fields.filter((field) => field.completed).length;

  return {
    id: doc.moduleId,
    name: doc.name,
    icon: doc.icon,
    description: doc.description,
    fields,
    completion: totalFields ? Math.round((completedFields / totalFields) * 100) : 0,
    totalFields,
    completedFields,
  };
}

function toAnswer(doc: IDNAAnswerDocument): IDNAAnswer {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    questionId: String(doc.questionId),
    value: doc.value,
    answeredAt: doc.answeredAt.toISOString(),
  };
}

function toRecommendation(doc: IDNARecommendationDocument): IDNARecommendation {
  return {
    id: String(doc._id),
    missionId: String(doc.missionId),
    title: doc.title,
    matchScore: doc.matchScore,
    reason: doc.reason,
    rewardPreview: doc.rewardPreview,
    difficulty: doc.difficulty,
  };
}

function buildProfile(
  modules: IDNAModule[],
  questions: IDNAQuestion[],
  answers: IDNAAnswer[]
): ExplorerDNAProfile {
  const answeredIds = new Set(answers.map((a) => a.questionId));
  const enabledQuestions = questions.filter((q) => q.enabled);
  const pendingQuestions = enabledQuestions.filter((q) => !answeredIds.has(q.id)).length;
  const totalXpEarned = answers.reduce((sum, a) => {
    const q = enabledQuestions.find((item) => item.id === a.questionId);
    return sum + (q?.xpReward ?? 0);
  }, 0);
  const completedModules = modules.filter((m) => m.completion >= 100).length;
  const totalModules = modules.length;
  const completionPercent = enabledQuestions.length
    ? Math.min(100, Math.round((answers.length / enabledQuestions.length) * 100))
    : 0;

  return {
    completionPercent,
    completedModules,
    totalModules,
    intelligenceScore: 100 + answers.length * 12 + completedModules * 50,
    nextReward: completionPercent < 75 ? "+150 XP · DNA Insight Badge at 75%" : "",
    pendingQuestions,
    totalXpEarned,
    badges: [],
  };
}

function requireDb(): void {
  if (!isDbConnected()) {
    throw new Error("Database not connected");
  }
}

/** List all DNA questions from the database. Returns [] when DB is empty or offline. */
export async function listQuestions(): Promise<IDNAQuestion[]> {
  if (!isDbConnected()) return [];
  const docs = await DNAQuestion.find().sort({ order: 1, createdAt: 1 }).exec();
  return docs.map(toQuestion);
}

/** Replace question order in the database. */
export async function replaceQuestions(next: IDNAQuestion[]): Promise<IDNAQuestion[]> {
  requireDb();

  await Promise.all(
    next.map((question, index) => {
      if (!mongoose.Types.ObjectId.isValid(question.id)) return Promise.resolve(null);
      return DNAQuestion.findByIdAndUpdate(question.id, { order: index + 1 }, { new: true }).exec();
    })
  );

  return listQuestions();
}

/** Create or update a DNA question using database fields only. */
export async function upsertQuestion(input: IDNAQuestion): Promise<IDNAQuestion> {
  requireDb();

  const payload = {
    prompt: input.prompt,
    category: input.category,
    answerType: input.answerType,
    options: input.options,
    xpReward: input.xpReward,
    coinReward: input.coinReward ?? 0,
    enabled: input.enabled,
    order: input.order,
    unlockCondition: input.unlockCondition,
  };

  if (input.id && mongoose.Types.ObjectId.isValid(input.id)) {
    const updated = await DNAQuestion.findByIdAndUpdate(input.id, payload, { new: true }).exec();
    if (!updated) throw new Error("Question not found");
    return toQuestion(updated);
  }

  const created = await DNAQuestion.create(payload);
  return toQuestion(created);
}

/** Delete a DNA question by id. */
export async function deleteQuestion(id: string): Promise<boolean> {
  requireDb();
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const result = await DNAQuestion.findByIdAndDelete(id).exec();
  return Boolean(result);
}

/** Load a user's Explorer DNA payload from the database only. */
export async function getUserDnaData(userId: string): Promise<ExplorerDNAData> {
  requireDb();

  const userObjectId = mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : null;

  if (!userObjectId) return emptyExplorerData();

  const [moduleDocs, questionDocs, answerDocs, recommendationDocs] = await Promise.all([
    DNAModule.find({ enabled: true }).sort({ order: 1 }).exec(),
    DNAQuestion.find({ enabled: true }).sort({ order: 1 }).exec(),
    DNAAnswer.find({ userId: userObjectId }).exec(),
    DNARecommendation.find({ userId: userObjectId, dismissed: false })
      .sort({ matchScore: -1 })
      .limit(4)
      .exec(),
  ]);

  const modules = moduleDocs.map(toModule);
  const questions = questionDocs.map(toQuestion);
  const answers = answerDocs.map(toAnswer);
  const recommendations = recommendationDocs.map(toRecommendation);
  const answeredIds = new Set(answers.map((a) => a.questionId));

  return {
    profile: buildProfile(modules, questions, answers),
    modules,
    questions: questions.map((q) => ({ ...q, isNew: !answeredIds.has(q.id) })),
    answers,
    matchScores: [],
    recommendations,
  };
}

/** Persist a DNA answer and return reward deltas. */
export async function submitDnaAnswer(
  userId: string,
  questionId: string,
  value: AnswerValue
): Promise<{
  answer: IDNAAnswer;
  xpAwarded: number;
  coinsAwarded: number;
  completionDelta: number;
  intelligenceDelta: number;
} | null> {
  requireDb();

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(questionId)) {
    return null;
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const questionObjectId = new mongoose.Types.ObjectId(questionId);

  const questionDoc = await DNAQuestion.findOne({ _id: questionObjectId, enabled: true }).exec();
  if (!questionDoc) return null;

  const existing = await DNAAnswer.findOne({ userId: userObjectId, questionId: questionObjectId }).exec();
  if (existing) return null;

  const xpAwarded = questionDoc.xpReward;
  const coinsAwarded = questionDoc.coinReward ?? 0;

  const answerDoc = await DNAAnswer.create({
    userId: userObjectId,
    questionId: questionObjectId,
    value,
    xpAwarded,
    coinsAwarded,
  });

  return {
    answer: toAnswer(answerDoc),
    xpAwarded,
    coinsAwarded,
    completionDelta: 1,
    intelligenceDelta: 12,
  };
}
