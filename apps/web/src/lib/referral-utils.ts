import type { VideoPlatform } from "@tasks-cash/types";

const PLATFORM_RULES: Array<{ platform: VideoPlatform; patterns: RegExp[] }> = [
  { platform: "tiktok", patterns: [/tiktok\.com/i, /vm\.tiktok\.com/i] },
  { platform: "instagram", patterns: [/instagram\.com/i, /instagr\.am/i] },
  { platform: "youtube", patterns: [/youtube\.com/i, /youtu\.be/i] },
  { platform: "facebook", patterns: [/facebook\.com/i, /fb\.watch/i] },
  { platform: "snapchat", patterns: [/snapchat\.com/i] },
  { platform: "twitter", patterns: [/twitter\.com/i, /x\.com/i] },
];

export function detectVideoPlatform(url: string): VideoPlatform {
  const value = url.trim();
  if (!value) return "unknown";
  for (const rule of PLATFORM_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(value))) return rule.platform;
  }
  return "unknown";
}

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

export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-amber-400" },
  approved: { label: "Approved", className: "text-emerald-400" },
  rejected: { label: "Rejected", className: "text-red-400" },
  rewarded: { label: "Rewarded", className: "text-violet-300" },
};

export const REFERRAL_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-amber-400" },
  active: { label: "Active", className: "text-emerald-400" },
  rewarded: { label: "Rewarded", className: "text-violet-300" },
  rejected: { label: "Rejected", className: "text-red-400" },
};
