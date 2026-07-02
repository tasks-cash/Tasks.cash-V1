export type VideoSubmissionStatus = "pending" | "approved" | "rejected" | "rewarded";

export type VideoPlatform =
  | "TikTok"
  | "Instagram"
  | "YouTube"
  | "Facebook"
  | "Snapchat"
  | "X / Twitter"
  | "Unknown";

export interface VideoSubmission {
  id: string;
  userId: string;
  videoUrl: string;
  platform: VideoPlatform;
  visibleViews: number;
  ideaTitle: string;
  description: string;
  status: VideoSubmissionStatus;
  rewardXp: number;
  bronzeCoins: number;
  silverCoins: number;
  goldCoins: number;
  adminResponse?: string;
  submittedAt: string;
}

export interface VideoSubmissionStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalXp: number;
  totalGold: number;
  totalSilver: number;
  totalBronze: number;
}
