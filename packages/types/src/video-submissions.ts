/** Video Hunter submission types */

export type VideoSubmissionStatus = "pending" | "approved" | "rejected" | "rewarded";

export type VideoPlatform =
  | "tiktok"
  | "instagram"
  | "youtube"
  | "facebook"
  | "snapchat"
  | "twitter"
  | "unknown";

export interface IVideoSubmission {
  id: string;
  userId: string;
  videoUrl: string;
  platform: VideoPlatform;
  visibleViews: number;
  screenshotProofUrl?: string;
  description?: string;
  status: VideoSubmissionStatus;
  rewardXp: number;
  bronzeCoins: number;
  silverCoins: number;
  goldCoins: number;
  diamondGems: number;
  adminResponse?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
