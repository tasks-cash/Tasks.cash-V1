"use client";

import { useEffect, useState } from "react";
import type { IReferralMeResponse } from "@tasks-cash/types";
import { GlassCard, PortalButton, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ReferralQrCode } from "@/components/referrals/ReferralQrCode";
import { apiFetch } from "@/lib/api";
import { buildReferralLink } from "@/lib/referral-storage";
import { REFERRAL_STATUS_LABELS } from "@/lib/referral-utils";
const EMPTY_REFERRAL: IReferralMeResponse = {
  referralCode: "",
  referralLink: "",
  totalInvites: 0,
  activeReferrals: 0,
  pendingRewards: 0,
  earnedRewards: 0,
  history: [],
};

export default function ReferralsPage() {
  const [data, setData] = useState<IReferralMeResponse>(EMPTY_REFERRAL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await apiFetch<IReferralMeResponse>("/api/referrals/me");
      if (res.success && res.data) {
        setData({
          ...res.data,
          referralLink: res.data.referralLink || buildReferralLink(res.data.referralCode),
        });
      } else if (res.error) {
        setError(res.error);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DashboardPageShell title="Referrals" subtitle="Invite allies, share your QR code, and earn referral rewards">
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatWidget label="Total Invited" value={data.totalInvites} icon="🔗" />
        <StatWidget label="Active Referrals" value={data.activeReferrals} icon="⚡" glow="purple" />
        <StatWidget label="Pending Rewards" value={`${data.pendingRewards} ◈`} icon="⏳" />
        <StatWidget label="Earned Rewards" value={`${data.earnedRewards} ◈`} icon="🎁" glow="gold" />
      </div>

      <GlassCard glow="gold" className="p-6 md:p-8 mb-8">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-purple-400/60 mb-2">Your Referral Code</p>
          <p className="text-3xl md:text-4xl font-black text-amber-400 tracking-widest">{data.referralCode}</p>
        </div>

        <ReferralQrCode
          referralCode={data.referralCode}
          referralLink={data.referralLink || buildReferralLink(data.referralCode)}
        />
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-bold text-white">Referral History</h2>
          {loading && <span className="text-xs text-purple-400/50">Syncing...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-purple-400/60 border-b border-purple-500/20">
                <th className="pb-3 pr-4">Referred User</th>
                <th className="pb-3 pr-4">Date</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Reward</th>
                <th className="pb-3">Admin Note</th>
              </tr>
            </thead>
            <tbody>
              {data.history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-purple-400/50">
                    No referrals yet — share your invite link to begin.
                  </td>
                </tr>
              ) : (
                data.history.map((row) => {
                  const status = REFERRAL_STATUS_LABELS[row.status] ?? REFERRAL_STATUS_LABELS.pending;
                  return (
                    <tr key={row.id} className="border-b border-purple-500/10">
                      <td className="py-3 pr-4 text-white">{row.referredUser?.username ?? "Explorer"}</td>
                      <td className="py-3 pr-4 text-purple-300">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className={`py-3 pr-4 capitalize ${status.className}`}>{status.label}</td>
                      <td className="py-3 pr-4 text-amber-400">
                        {row.rewardCoins > 0 ? `${row.rewardCoins} ◈` : "—"}
                        {row.rewardXp > 0 ? ` · ${row.rewardXp} XP` : ""}
                      </td>
                      <td className="py-3 text-purple-300/70">{row.adminNote ?? "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <PortalButton
            variant="gold"
            size="sm"
            onClick={() => navigator.clipboard?.writeText(data.referralLink || buildReferralLink(data.referralCode))}
          >
            Copy Referral Link
          </PortalButton>
        </div>
      </GlassCard>
    </DashboardPageShell>
  );
}
