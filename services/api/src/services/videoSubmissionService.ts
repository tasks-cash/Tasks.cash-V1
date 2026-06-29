import type { IVideoSubmission } from "@tasks-cash/types";
import { isDbConnected } from "../config/database";
import { VideoSubmission, IVideoSubmissionDocument } from "../models/VideoSubmission";
import { memoryStore } from "../lib/memoryStore";

function mapVideo(doc: IVideoSubmissionDocument): IVideoSubmission {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    videoUrl: doc.videoUrl,
    platform: doc.platform,
    visibleViews: doc.visibleViews,
    screenshotProofUrl: doc.screenshotProofUrl,
    description: doc.description,
    status: doc.status,
    rewardXp: doc.rewardXp,
    bronzeCoins: doc.bronzeCoins,
    silverCoins: doc.silverCoins,
    goldCoins: doc.goldCoins,
    diamondGems: doc.diamondGems,
    adminResponse: doc.adminResponse,
    submittedAt: doc.submittedAt.toISOString(),
    reviewedAt: doc.reviewedAt?.toISOString(),
    reviewedBy: doc.reviewedBy?.toString(),
  };
}

export async function listAllVideoSubmissions() {
  if (!isDbConnected()) {
    return memoryStore.listVideoSubmissions();
  }

  const docs = await VideoSubmission.find().sort({ submittedAt: -1 }).limit(100);
  return docs.map(mapVideo);
}

export async function approveVideoSubmission(
  id: string,
  reviewerId: string,
  payload: {
    adminResponse?: string;
    rewardXp?: number;
    bronzeCoins?: number;
    silverCoins?: number;
    goldCoins?: number;
    diamondGems?: number;
  }
) {
  if (!isDbConnected()) {
    return memoryStore.reviewVideoSubmission(id, "approved", {
      ...payload,
      reviewedBy: reviewerId,
      status: "approved",
    });
  }

  const doc = await VideoSubmission.findByIdAndUpdate(
    id,
    {
      status: "approved",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      adminResponse: payload.adminResponse,
      rewardXp: payload.rewardXp ?? 0,
      bronzeCoins: payload.bronzeCoins ?? 0,
      silverCoins: payload.silverCoins ?? 0,
      goldCoins: payload.goldCoins ?? 0,
      diamondGems: payload.diamondGems ?? 0,
    },
    { new: true }
  );

  return doc ? mapVideo(doc) : null;
}

export async function rejectVideoSubmission(id: string, reviewerId: string, adminResponse: string) {
  if (!isDbConnected()) {
    return memoryStore.reviewVideoSubmission(id, "rejected", {
      adminResponse,
      reviewedBy: reviewerId,
    });
  }

  const doc = await VideoSubmission.findByIdAndUpdate(
    id,
    {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      adminResponse,
    },
    { new: true }
  );

  return doc ? mapVideo(doc) : null;
}
