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
