/**
 * Deterministic campaign asset validation (no AI).
 */

import type { GeneratedAssetContent } from "../providers/types";
import { LANGUAGES, CHANNELS, type CampaignLanguage, type Channel } from "../constants";

const PLACEHOLDER_RE = /\{\{[^}]+\}\}|\[INSERT[^\]]*\]|TODO_REPLACE/i;
const HTML_RE = /<\/?[a-z][\s\S]*>/i;

export function detectLanguageMismatch(text: string | undefined, expected: CampaignLanguage): boolean {
  if (!text || text.length < 8) return false;
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;
  if (expected === "ar") return arabicChars < 3 && latinChars > 20;
  if (expected === "en" || expected === "fr") return arabicChars > 10 && latinChars < 5;
  return false;
}

export function validateAssetDeterministic(input: {
  content: GeneratedAssetContent;
  language: CampaignLanguage;
  channel: Channel;
  assetType: string;
  forbiddenPhrases?: string[];
  mandatoryStatements?: string[];
  maxBodyLength?: number;
  minBodyLength?: number;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const { content } = input;
  const body = content.body || content.script || content.captions || "";

  if (!CHANNELS.includes(input.channel)) errors.push("Invalid channel");
  if (!LANGUAGES.includes(input.language)) errors.push("Invalid language");
  if (!content.callToAction) errors.push("CTA required");
  if (!body) errors.push("Body/script/captions required");
  if (PLACEHOLDER_RE.test(body) || PLACEHOLDER_RE.test(content.title || "")) {
    errors.push("Placeholder leakage detected");
  }
  if (HTML_RE.test(body)) errors.push("HTML not allowed in this asset");
  if (detectLanguageMismatch(body, input.language)) {
    errors.push(`Language mismatch for ${input.language}`);
  }
  const max = input.maxBodyLength ?? 2_000;
  const min = input.minBodyLength ?? 10;
  if (body.length > max) errors.push(`Body exceeds max length ${max}`);
  if (body.length > 0 && body.length < min) errors.push(`Body below min length ${min}`);

  for (const phrase of input.forbiddenPhrases ?? []) {
    if (phrase && body.toLowerCase().includes(phrase.toLowerCase())) {
      errors.push(`Forbidden phrase present: ${phrase}`);
    }
  }
  for (const stmt of input.mandatoryStatements ?? []) {
    if (stmt && !body.includes(stmt) && !(content.complianceNotes || []).some((n) => n.includes(stmt))) {
      errors.push(`Missing mandatory statement`);
      break;
    }
  }
  for (const tag of content.hashtags ?? []) {
    if (!/^#[\w\u0600-\u06FF]+$/u.test(tag)) errors.push(`Malformed hashtag: ${tag}`);
  }

  return { ok: errors.length === 0, errors };
}

export function localeForLanguage(lang: CampaignLanguage): string {
  if (lang === "ar") return "ar-SA";
  if (lang === "fr") return "fr-FR";
  return "en-US";
}

export function textDirection(lang: CampaignLanguage): "rtl" | "ltr" {
  return lang === "ar" ? "rtl" : "ltr";
}

export function channelDefaultAssetType(channel: Channel): string {
  const map: Record<Channel, string> = {
    facebook: "social_post",
    instagram_post: "social_post",
    instagram_story: "story",
    instagram_reel: "reel",
    tiktok: "tiktok",
    youtube_shorts: "youtube_short",
    youtube: "youtube_video",
    email: "email_body",
    landing_page: "landing_page_copy",
    push_notification: "push_notification",
  };
  return map[channel];
}
