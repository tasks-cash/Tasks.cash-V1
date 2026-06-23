"use client";

import { GlassCard, PortalButton, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_REFERRALS } from "@/lib/page-data";

export default function ReferralsPage() {
  const code = "VOID-7X9K";
  const totalEarned = DASHBOARD_REFERRALS.reduce((sum, r) => sum + r.earned, 0);

  return (
    <DashboardPageShell title="Referrals" subtitle="Invite allies and earn bonus coins">
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatWidget label="Allies Recruited" value={DASHBOARD_REFERRALS.length} icon="🔗" />
        <StatWidget label="Coins Earned" value={totalEarned} icon="◈" glow="gold" />
        <StatWidget label="Bonus Per Ally" value="500 ◈" icon="🎁" />
      </div>

      <GlassCard glow="gold" className="p-8 mb-8 text-center">
        <p className="text-xs uppercase tracking-widest text-purple-400/60 mb-2">Your Referral Code</p>
        <p className="text-4xl font-black text-amber-400 tracking-widest mb-4">{code}</p>
        <PortalButton variant="gold" size="sm" onClick={() => navigator.clipboard?.writeText(code)}>
          Copy Code
        </PortalButton>
        <p className="text-sm text-purple-400/50 mt-4">Share: https://tasks.cash/register?ref={code}</p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-bold text-white mb-4">Your Allies</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-purple-400/60 border-b border-purple-500/20">
                <th className="pb-3 pr-4">Username</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 pr-4">Earned</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {DASHBOARD_REFERRALS.map((r) => (
                <tr key={r.username} className="border-b border-purple-500/10">
                  <td className="py-3 pr-4 text-white">{r.username}</td>
                  <td className="py-3 pr-4 text-purple-300">{r.joined}</td>
                  <td className="py-3 pr-4 text-amber-400">{r.earned} ◈</td>
                  <td className="py-3 text-green-400 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </DashboardPageShell>
  );
}
