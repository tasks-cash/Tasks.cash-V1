import type { ReferralStatus } from "@/types/referrals";

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";

export function buildReferralLink(code: string): string {
  if (!code) return "";
  return `${MAIN_APP_URL}/register?ref=${encodeURIComponent(code)}`;
}

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-amber-300 border-amber-400/30 bg-amber-950/30" },
  active: { label: "Active", className: "text-emerald-300 border-emerald-400/30 bg-emerald-950/30" },
  rewarded: { label: "Rewarded", className: "text-violet-200 border-violet-400/30 bg-violet-950/30" },
  rejected: { label: "Rejected", className: "text-red-300 border-red-400/30 bg-red-950/30" },
};

export function formatRewardCoins(coins: number): string {
  return coins > 0 ? `◈ ${coins.toLocaleString()}` : "—";
}
