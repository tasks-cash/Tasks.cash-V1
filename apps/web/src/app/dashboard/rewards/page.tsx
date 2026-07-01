"use client";

import { useEffect, useState } from "react";
import { GlassCard, PortalButton, Badge, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { apiFetch } from "@/lib/api";

type RewardItem = {
  _id: string;
  name: string;
  amountLabel?: string;
  status: "available" | "pending" | "claimed";
  description?: string;
  value?: number;
  unlocked?: boolean;
  owned?: boolean;
};

const STATUS_STYLE: Record<string, string> = {
  claimed: "text-green-400",
  pending: "text-amber-400",
  available: "text-purple-300",
};

export default function DashboardRewardsPage() {
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [claimMsg, setClaimMsg] = useState("");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await apiFetch<RewardItem[]>("/api/rewards");
      if (res.success && res.data) {
        setRewards(
          res.data.map((r) => ({
            _id: r._id,
            name: r.name,
            amountLabel: r.amountLabel ?? `${r.value ?? ""}`,
            status: r.status ?? (r.owned ? "claimed" : r.unlocked ? "available" : "pending"),
            description: r.description,
          }))
        );
      } else if (res.error) {
        setError(res.error);
      }
      setLoading(false);
    }
    load();
  }, [claimMsg]);

  async function handleClaim(id: string) {
    setClaimingId(id);
    setClaimMsg("");
    setError("");
    const res = await apiFetch(`/api/rewards/${id}/claim`, { method: "POST" });
    setClaimingId(null);
    if (res.success) {
      setClaimMsg("Reward claimed successfully.");
    } else {
      setError(res.error ?? "Could not claim reward");
    }
  }

  const claimable = rewards.filter((r) => r.status === "available" || r.status === "pending");

  return (
    <DashboardPageShell title="My Rewards" subtitle="Claim bonuses, streaks, and challenge prizes">
      {loading && <p className="text-xs text-purple-400/50 mb-4">Loading rewards...</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {claimMsg && <p className="text-emerald-400 text-sm mb-4">{claimMsg}</p>}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Claimable" value={claimable.length} icon="🎁" glow="gold" />
        <StatWidget label="Claimed" value={rewards.filter((r) => r.status === "claimed").length} icon="✅" />
        <StatWidget label="Total Listed" value={rewards.length} icon="💰" glow="gold" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {rewards.map((r) => (
          <GlassCard key={r._id} glow={r.status === "available" ? "gold" : undefined} className="p-6">
            <div className="flex justify-between items-start mb-3">
              <span className="text-3xl">🎁</span>
              <Badge variant={r.status === "available" ? "gold" : "default"}>{r.status}</Badge>
            </div>
            <h3 className="font-bold text-white">{r.name}</h3>
            <p className={`font-semibold mt-1 ${STATUS_STYLE[r.status]}`}>{r.amountLabel}</p>
            {r.description && <p className="text-xs text-purple-400/50 mt-2">{r.description}</p>}
            {r.status === "available" && (
              <PortalButton
                variant="gold"
                size="sm"
                className="mt-4 w-full"
                disabled={claimingId === r._id}
                onClick={() => handleClaim(r._id)}
              >
                {claimingId === r._id ? "Claiming..." : "Claim Now"}
              </PortalButton>
            )}
            {r.status === "pending" && (
              <PortalButton variant="secondary" size="sm" className="mt-4 w-full" disabled>
                Pending Review
              </PortalButton>
            )}
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <h2 className="font-bold text-white mb-4">Daily Reward Streak</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className={`flex-1 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${
                day <= 5
                  ? "bg-purple-600/40 text-amber-300 border border-purple-400/30"
                  : "bg-purple-950/40 text-purple-400/40 border border-purple-500/10"
              }`}
            >
              D{day}
            </div>
          ))}
        </div>
        <p className="text-sm text-purple-400/60 mt-3">5-day streak active — Day 6 unlocks 100 bonus coins</p>
      </GlassCard>
    </DashboardPageShell>
  );
}
