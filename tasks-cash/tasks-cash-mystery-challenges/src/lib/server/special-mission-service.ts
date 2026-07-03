import type {
  SpecialMission,
  SpecialMissionDetailPayload,
  SpecialMissionSubmission,
  SpecialMissionsPayload,
} from "@/types/special-mission";
import type { ISpecialMissionDoc } from "@/lib/server/models/SpecialMission";
import type { ISpecialMissionProofDoc } from "@/lib/server/models/SpecialMissionProof";
import { SpecialMissionModel } from "@/lib/server/models/SpecialMission";
import { SpecialMissionProofModel } from "@/lib/server/models/SpecialMissionProof";
import { connectDatabase } from "@/lib/server/db";
import { seedSpecialMissionsIfEmpty } from "@/lib/server/special-mission-seed";
import { ensureProofUploadDir, saveProofFile } from "@/lib/server/special-mission-uploads";

function normalizeSubmissionStatus(
  status: ISpecialMissionProofDoc["status"]
): SpecialMissionSubmission["status"] {
  if (status === "pending") return "pending_review";
  return status as SpecialMissionSubmission["status"];
}

function mapMission(doc: ISpecialMissionDoc): SpecialMission {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    category: doc.category,
    requiredProof: doc.requiredProof,
    rules: Array.isArray(doc.rules) ? doc.rules : [],
    rewardXp: doc.rewardXp,
    bronzeCoins: doc.bronzeCoins,
    silverCoins: doc.silverCoins,
    goldCoins: doc.goldCoins,
    deadline: doc.deadline.toISOString(),
    status: doc.status,
    difficulty: doc.difficulty,
    isActive: doc.isActive,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function mapSubmission(doc: ISpecialMissionProofDoc): SpecialMissionSubmission {
  return {
    id: doc._id.toString(),
    missionId: doc.missionId.toString(),
    userId: doc.userId,
    proofText: doc.proofText,
    proofUrl: doc.proofUrl,
    proofFileUrl: doc.proofFileUrl,
    userNote: doc.userNote,
    status: normalizeSubmissionStatus(doc.status),
    adminNote: doc.adminNote,
    submittedAt: doc.submittedAt.toISOString(),
    reviewedAt: doc.reviewedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listSpecialMissions(): Promise<SpecialMissionsPayload> {
  await connectDatabase();
  await seedSpecialMissionsIfEmpty();

  const docs = await SpecialMissionModel.find({ isActive: true }).sort({ createdAt: 1 });
  const missions = docs.map((doc) => mapMission(doc));

  return { missions, total: missions.length };
}

export async function getSpecialMissionById(
  missionId: string,
  userId?: string
): Promise<SpecialMissionDetailPayload | null> {
  await connectDatabase();
  await seedSpecialMissionsIfEmpty();

  const doc = await SpecialMissionModel.findById(missionId);
  if (!doc || !doc.isActive) return null;

  let submissions: SpecialMissionSubmission[] = [];
  if (userId) {
    const rows = await SpecialMissionProofModel.find({ missionId: doc._id, userId }).sort({
      submittedAt: -1,
    });
    submissions = rows.map(mapSubmission);
  }

  return { mission: mapMission(doc), submissions };
}

export async function createSpecialMission(input: {
  title: string;
  description: string;
  category: string;
  requiredProof: string;
  rules?: string[];
  rewardXp?: number;
  bronzeCoins?: number;
  silverCoins?: number;
  goldCoins?: number;
  deadline: string;
  status?: SpecialMission["status"];
  difficulty?: SpecialMission["difficulty"];
  isActive?: boolean;
}): Promise<SpecialMission> {
  await connectDatabase();

  const doc = await SpecialMissionModel.create({
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category.trim(),
    requiredProof: input.requiredProof.trim(),
    rules: input.rules ?? [],
    rewardXp: input.rewardXp ?? 0,
    bronzeCoins: input.bronzeCoins ?? 0,
    silverCoins: input.silverCoins ?? 0,
    goldCoins: input.goldCoins ?? 0,
    deadline: new Date(input.deadline),
    status: input.status ?? "open",
    difficulty: input.difficulty ?? "Medium",
    isActive: input.isActive ?? true,
  });

  return mapMission(doc);
}

export interface SubmitProofInput {
  proofText?: string;
  proofUrl?: string;
  proofFile?: File | null;
  userNote?: string;
}

export async function submitSpecialMissionProof(
  missionId: string,
  userId: string,
  input: SubmitProofInput
): Promise<{ mission: SpecialMission; submission: SpecialMissionSubmission }> {
  await connectDatabase();
  await ensureProofUploadDir();

  const mission = await SpecialMissionModel.findById(missionId);
  if (!mission || !mission.isActive) {
    throw new Error("Mission not found");
  }

  if (mission.status === "closed" || mission.status === "archived") {
    throw new Error("Mission is no longer accepting proof");
  }

  const proofText = input.proofText?.trim();
  const proofUrl = input.proofUrl?.trim();
  const userNote = input.userNote?.trim();

  let proofFileUrl: string | undefined;
  if (input.proofFile && input.proofFile.size > 0) {
    const saved = await saveProofFile(input.proofFile);
    if ("error" in saved) throw new Error(saved.error);
    proofFileUrl = saved.url;
  }

  if (!proofText && !proofUrl && !proofFileUrl) {
    throw new Error("Provide proof text, a proof URL, or upload a proof file");
  }

  const submission = await SpecialMissionProofModel.create({
    missionId: mission._id,
    userId,
    proofText,
    proofUrl,
    proofFileUrl,
    userNote,
    status: "pending_review",
    submittedAt: new Date(),
  });

  return { mission: mapMission(mission), submission: mapSubmission(submission) };
}
