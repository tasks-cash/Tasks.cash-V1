import type { VideoSubmission, VideoSubmissionStats } from "@/types/video-submission";
import type { IVideoSubmissionDoc } from "@/lib/server/models/VideoSubmission";
import { VideoSubmissionModel } from "@/lib/server/models/VideoSubmission";
import { connectDatabase } from "@/lib/server/db";
import { detectPlatformFromUrl } from "@/lib/video-hunter/platform";

function mapDoc(doc: IVideoSubmissionDoc): VideoSubmission {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    videoUrl: doc.videoUrl,
    platform: doc.platform,
    visibleViews: doc.visibleViews,
    ideaTitle: doc.ideaTitle,
    description: doc.description,
    status: doc.status,
    rewardXp: doc.rewardXp,
    bronzeCoins: doc.bronzeCoins,
    silverCoins: doc.silverCoins,
    goldCoins: doc.goldCoins,
    adminResponse: doc.adminResponse,
    submittedAt: doc.submittedAt.toISOString(),
  };
}

function computeStats(submissions: VideoSubmission[]): VideoSubmissionStats {
  return {
    total: submissions.length,
    approved: submissions.filter((s) => s.status === "approved" || s.status === "rewarded").length,
    pending: submissions.filter((s) => s.status === "pending").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    totalXp: submissions.reduce((sum, s) => sum + s.rewardXp, 0),
    totalGold: submissions.reduce((sum, s) => sum + s.goldCoins, 0),
    totalSilver: submissions.reduce((sum, s) => sum + s.silverCoins, 0),
    totalBronze: submissions.reduce((sum, s) => sum + s.bronzeCoins, 0),
  };
}

async function seedDefaultSubmissions(userId: string): Promise<void> {
  const existing = await VideoSubmissionModel.countDocuments({ userId });
  if (existing > 0) return;

  const now = Date.now();
  await VideoSubmissionModel.insertMany([
    {
      userId,
      videoUrl: "https://www.youtube.com/watch?v=vh-approved-demo",
      platform: "YouTube",
      visibleViews: 24500,
      ideaTitle: "Portal Boss Rush Highlights",
      description: "Gaming montage with strong retention in the first 3 seconds — ideal for Video Hunter rewards.",
      status: "approved",
      rewardXp: 500,
      bronzeCoins: 24,
      silverCoins: 38,
      goldCoins: 120,
      adminResponse: "Verified views — base payout credited.",
      submittedAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      videoUrl: "https://www.tiktok.com/@explorer/video/pending-demo",
      platform: "TikTok",
      visibleViews: 11800,
      ideaTitle: "Rewards Showdown Reel",
      description: "Debate-style hook comparing two mystery reward systems for our audience.",
      status: "pending",
      rewardXp: 0,
      bronzeCoins: 0,
      silverCoins: 0,
      goldCoins: 0,
      adminResponse: "Awaiting manual review.",
      submittedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      videoUrl: "https://www.youtube.com/watch?v=vh-rejected-demo",
      platform: "YouTube",
      visibleViews: 9200,
      ideaTitle: "Low View Test Clip",
      description: "Submitted before hitting the 10K view threshold.",
      status: "rejected",
      rewardXp: 0,
      bronzeCoins: 0,
      silverCoins: 0,
      goldCoins: 0,
      adminResponse: "Below 10K view threshold.",
      submittedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
  ]);
}

export async function listUserVideoSubmissions(userId: string): Promise<{
  submissions: VideoSubmission[];
  stats: VideoSubmissionStats;
}> {
  await connectDatabase();
  await seedDefaultSubmissions(userId);

  const docs = await VideoSubmissionModel.find({ userId }).sort({ submittedAt: -1 });
  const submissions = docs.map(mapDoc);
  return { submissions, stats: computeStats(submissions) };
}

export async function createVideoSubmission(
  userId: string,
  input: {
    videoUrl: string;
    visibleViews: number;
    ideaTitle: string;
    description: string;
    platform?: string;
  }
): Promise<VideoSubmission> {
  await connectDatabase();

  const platform = (input.platform as VideoSubmission["platform"]) || detectPlatformFromUrl(input.videoUrl) || "Unknown";

  const doc = await VideoSubmissionModel.create({
    userId,
    videoUrl: input.videoUrl,
    platform,
    visibleViews: input.visibleViews,
    ideaTitle: input.ideaTitle,
    description: input.description,
    status: "pending",
    rewardXp: 0,
    bronzeCoins: 0,
    silverCoins: 0,
    goldCoins: 0,
    adminResponse: "Queued for admin review.",
    submittedAt: new Date(),
  });

  return mapDoc(doc);
}
