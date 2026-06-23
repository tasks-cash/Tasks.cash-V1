"use client";

import { GlassCard, PortalButton, Badge, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_REWARDS } from "@/lib/page-data";

const STATUS_STYLE: Record<string, string> = {
  claimed: "text-green-400",
  pending: "text-amber-400",
  available: "text-purple-300",
};

export default function DashboardRewardsPage() {
  const claimable = DASHBOARD_REWARDS.filter((r) => r.status === "available" || r.status === "pending");

  return (
    <DashboardPageShell title="My Rewards" subtitle="Claim bonuses, streaks, and challenge prizes">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Claimable" value={claimable.length} icon="🎁" glow="gold" />
        <StatWidget label="Claimed This Week" value={3} icon="✅" />
        <StatWidget label="Total Earned" value="2,450 ◈" icon="💰" glow="gold" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {DASHBOARD_REWARDS.map((r) => (
          <GlassCard key={r.id} glow={r.status === "available" ? "gold" : undefined} className="p-6">
            <div className="flex justify-between items-start mb-3">
              <span className="text-3xl">🎁</span>
              <Badge variant={r.status === "available" ? "gold" : "default"}>{r.status}</Badge>
            </div>
            <h3 className="font-bold text-white">{r.name}</h3>
            <p className="text-amber-400 font-semibold mt-1">{r.amount}</p>
            <p className="text-xs text-purple-400/50 mt-2">{r.date}</p>
            {(r.status === "available" || r.status === "pending") && (
              <PortalButton variant="gold" size="sm" className="mt-4 w-full">
                {r.status === "available" ? "Claim Now" : "Pending Review"}
              </PortalButton>
            )}
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h2 className="font-bold text-white mb-4">Daily Reward Streak</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div key={day} className={`flex-1 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${day <= 5 ? "bg-purple-600/40 text-amber-300 border border-purple-400/30" : "bg-purple-950/40 text-purple-400/40 border border-purple-500/10"}`}>
              D{day}
            </div>
          ))}
        </div>
        <p className="text-sm text-purple-400/60 mt-3">5-day streak active — Day 6 unlocks 100 bonus coins</p>
      </GlassCard>
    </DashboardPageShell>
  );
}
