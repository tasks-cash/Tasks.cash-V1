import type { VideoPlatform } from "@/types/video-submission";

export function detectPlatformFromUrl(url: string): VideoPlatform | null {
  const lower = url.toLowerCase().trim();
  if (!lower) return null;
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YouTube";
  if (lower.includes("tiktok.com")) return "TikTok";
  if (lower.includes("instagram.com")) return "Instagram";
  if (lower.includes("facebook.com") || lower.includes("fb.watch") || lower.includes("fb.com")) return "Facebook";
  if (lower.includes("snapchat.com")) return "Snapchat";
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "X / Twitter";
  return null;
}

export const PLATFORM_ICONS: Record<VideoPlatform, string> = {
  TikTok: "🎵",
  Instagram: "📸",
  YouTube: "▶️",
  Facebook: "📘",
  Snapchat: "👻",
  "X / Twitter": "𝕏",
  Unknown: "🔗",
};

export const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
  rewarded: "Rewarded",
};

export function formatViews(views: number): string {
  return views.toLocaleString();
}

export function parseViewsInput(raw: string): number {
  const n = Number(String(raw).replace(/,/g, "").trim());
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
