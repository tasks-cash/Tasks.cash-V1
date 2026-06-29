import type { VideoPlatform, VideoSubmissionStatus } from "@tasks-cash/types";

export function platformLabel(platform: VideoPlatform): string {
  const labels: Record<VideoPlatform, string> = {
    tiktok: "TikTok",
    instagram: "Instagram",
    youtube: "YouTube",
    facebook: "Facebook",
    snapchat: "Snapchat",
    twitter: "X / Twitter",
    unknown: "Unknown",
  };
  return labels[platform];
}

export const STATUS_LABELS: Record<VideoSubmissionStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-amber-400" },
  approved: { label: "Approved", className: "text-emerald-400" },
  rejected: { label: "Rejected", className: "text-red-400" },
  rewarded: { label: "Rewarded", className: "text-violet-300" },
};
