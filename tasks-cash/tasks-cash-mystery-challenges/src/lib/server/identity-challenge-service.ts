import type {
  IdentityAnswerResult,
  IdentityChallengePayload,
  IdentityQuestion,
  IdentityQuestionType,
} from "@/types/identity-challenge";
import { connectDatabase } from "@/lib/server/db";
import { IdentityQuestionModel, type IIdentityQuestionDoc } from "@/lib/server/models/IdentityQuestion";
import { IdentityAnswerModel } from "@/lib/server/models/IdentityAnswer";

const EMPTY_PAYLOAD: IdentityChallengePayload = {
  questions: [],
  progress: { answered: 0, total: 0 },
};

function normalizeQuestionType(value?: string): IdentityQuestionType {
  if (value === "single_choice" || value === "multiple_choice" || value === "slider") {
    return value;
  }
  if (value === "text" || value === "short_text") {
    return "short_text";
  }
  return "short_text";
}

function mapQuestion(doc: IIdentityQuestionDoc, answered: boolean, answer?: string): IdentityQuestion {
  return {
    id: String(doc._id),
    title: doc.title?.trim() || doc.prompt?.trim() || "Untitled question",
    prompt: doc.prompt?.trim() || doc.title?.trim() || "Untitled question",
    questionType: normalizeQuestionType(doc.questionType),
    options: Array.isArray(doc.options) ? doc.options.filter(Boolean) : [],
    xpReward: Number(doc.xpReward) || 0,
    bronzeCoinsReward: Number(doc.bronzeCoinsReward) || 0,
    silverCoinsReward: Number(doc.silverCoinsReward) || 0,
    goldCoinsReward: Number(doc.goldCoinsReward) || 0,
    isActive: Boolean(doc.isActive),
    displayOrder: Number(doc.displayOrder) || 0,
    answered,
    answer,
  };
}

export async function getIdentityChallengeForUser(userId: string): Promise<IdentityChallengePayload> {
  if (!userId?.trim()) {
    return EMPTY_PAYLOAD;
  }

  try {
    await connectDatabase();

    const questionDocs = await IdentityQuestionModel.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean()
      .exec();

    if (!Array.isArray(questionDocs) || questionDocs.length === 0) {
      return EMPTY_PAYLOAD;
    }

    const answers = await IdentityAnswerModel.find({ userId: userId.trim() }).lean().exec();
    const answerMap = new Map(
      (Array.isArray(answers) ? answers : []).map((a) => [String(a.questionId), a])
    );

    const questions = questionDocs
      .map((doc) => {
        const id = String(doc._id);
        const existing = answerMap.get(id);
        return mapQuestion(
          doc as unknown as IIdentityQuestionDoc,
          Boolean(existing),
          existing?.answer ? String(existing.answer) : undefined
        );
      })
      .filter((q) => q.id);

    const answered = questions.filter((q) => q.answered).length;

    return {
      questions,
      progress: { answered, total: questions.length },
    };
  } catch (err) {
    console.error("[identity-challenge] getIdentityChallengeForUser:", err);
    throw new Error("Database unavailable");
  }
}

export async function submitIdentityAnswer(
  userId: string,
  questionId: string,
  answer: string
): Promise<IdentityAnswerResult> {
  const trimmedUserId = userId?.trim();
  const trimmedQuestionId = questionId?.trim();
  const trimmed = answer?.trim();

  if (!trimmedUserId) {
    throw new Error("User is required");
  }
  if (!trimmedQuestionId) {
    throw new Error("questionId is required");
  }
  if (!trimmed) {
    throw new Error("Answer is required");
  }

  try {
    await connectDatabase();

    const question = await IdentityQuestionModel.findById(trimmedQuestionId);
    if (!question || !question.isActive) {
      throw new Error("Question not found");
    }

    const existing = await IdentityAnswerModel.findOne({
      userId: trimmedUserId,
      questionId: trimmedQuestionId,
    });

    if (existing) {
      const payload = await getIdentityChallengeForUser(trimmedUserId);
      return {
        answerId: String(existing._id),
        questionId: trimmedQuestionId,
        rewardClaimed: false,
        rewards: {
          xp: 0,
          bronzeCoins: 0,
          silverCoins: 0,
          goldCoins: 0,
        },
        progress: payload.progress,
      };
    }

    const xpReward = Number(question.xpReward) || 0;
    const bronzeReward = Number(question.bronzeCoinsReward) || 0;
    const silverReward = Number(question.silverCoinsReward) || 0;
    const goldReward = Number(question.goldCoinsReward) || 0;

    const doc = await IdentityAnswerModel.create({
      userId: trimmedUserId,
      questionId: trimmedQuestionId,
      answer: trimmed,
      rewardClaimed: true,
      xpAwarded: xpReward,
      bronzeCoinsAwarded: bronzeReward,
      silverCoinsAwarded: silverReward,
      goldCoinsAwarded: goldReward,
    });

    const payload = await getIdentityChallengeForUser(trimmedUserId);

    return {
      answerId: String(doc._id),
      questionId: trimmedQuestionId,
      rewardClaimed: true,
      rewards: {
        xp: xpReward,
        bronzeCoins: bronzeReward,
        silverCoins: silverReward,
        goldCoins: goldReward,
      },
      progress: payload.progress,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "Question not found") {
      throw err;
    }
    console.error("[identity-challenge] submitIdentityAnswer:", err);
    throw new Error("Database unavailable");
  }
}
