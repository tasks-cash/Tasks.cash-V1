"use client";

import { useEffect, useState } from "react";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { GlassCard, GameButton } from "@tasks-cash/ui";
import { DUEL_TYPES } from "@/data/duel-arena-data";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type DuelMatchApi = {
  id: string;
  title: string;
  challenger?: string;
  opponent?: string;
  stakePreview?: string;
  status?: string;
  rewardPreview?: string;
};

export function DuelArenaPage() {
  const [duelType, setDuelType] = useState(DUEL_TYPES[0]);
  const [matches, setMatches] = useState<DuelMatchApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await apiFetch<DuelMatchApi[]>("/api/duels");
      if (res.success && res.data) {
        setMatches(res.data);
      } else {
        setError(res.error ?? "Failed to load duels");
      }
      setLoading(false);
    }
    load();
  }, []);

  const active = matches.filter((m) => m.status === "active");
  const pending = matches.filter((m) => m.status === "pending");

  return (
    <GameHubLayout
      breadcrumb="Hub · Duel Arena"
      eyebrow="1v1 Challenges"
      title="DUEL ARENA"
      subtitle="Challenge another explorer. One mission. One winner. One reward."
    >
      <GlassCard glow="gold" className="p-6 md:p-8 mb-10">
        <h3 className="text-lg font-black text-white mb-4">Create Duel</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-purple-400/50 block mb-1">Duel Type</label>
            <select
              value={duelType}
              onChange={(e) => setDuelType(e.target.value)}
              className="w-full rounded-xl border border-purple-500/25 bg-black/60 px-3 py-2.5 text-sm text-white focus:border-amber-400/40 focus:outline-none"
            >
              {DUEL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-purple-400/50 block mb-1">Reward Stake</label>
            <input type="text" placeholder="e.g. 200 Gold" className="w-full rounded-xl border border-purple-500/25 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-purple-400/30 focus:border-amber-400/40 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-purple-400/50 block mb-1">Time Limit</label>
            <input type="text" placeholder="e.g. 24 hours" className="w-full rounded-xl border border-purple-500/25 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-purple-400/30 focus:border-amber-400/40 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-purple-400/50 block mb-1">Invite Opponent</label>
            <input type="text" placeholder="@username" className="w-full rounded-xl border border-purple-500/25 bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-purple-400/30 focus:border-amber-400/40 focus:outline-none" />
          </div>
        </div>
        <GameButton variant="gold">Send Duel Invite</GameButton>
      </GlassCard>

      {loading && <p className="text-purple-400/50 text-sm mb-6">Loading duels…</p>}
      {error && !loading && <p className="text-amber-400 text-sm mb-6">{error}</p>}

      <section className="mb-10">
        <h3 className="text-lg font-black text-white mb-4">Active Duels</h3>
        {active.length === 0 ? (
          <GlassCard className="p-6 text-center text-purple-400/60">No active duels.</GlassCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {active.map((d) => (
              <GlassCard key={d.id} glow="gold" className="p-5 border-amber-400/25">
                <h4 className="font-bold text-white mb-2">{d.title}</h4>
                <p className="text-sm text-purple-300/70">{d.challenger ?? "—"} vs {d.opponent ?? "—"}</p>
                <div className="flex flex-wrap gap-2 text-xs mt-3">
                  {d.stakePreview && <span className="rounded-md border border-purple-500/20 bg-purple-950/30 px-2 py-1 text-purple-300">{d.stakePreview}</span>}
                  {d.rewardPreview && <span className="rounded-md border border-emerald-400/20 bg-emerald-950/30 px-2 py-1 text-emerald-300">{d.rewardPreview}</span>}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h3 className="text-lg font-black text-white mb-4">Pending Duels</h3>
        {pending.length === 0 ? (
          <GlassCard className="p-6 text-center text-purple-400/60">No pending duels.</GlassCard>
        ) : (
          <div className="space-y-3">
            {pending.map((d) => (
              <GlassCard key={d.id} glow="violet" className="p-5 flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <p className="font-bold text-white">{d.challenger ?? "—"} vs {d.opponent ?? "—"}</p>
                  <p className="text-xs text-purple-400/50 mt-1">{d.title} · {d.rewardPreview ?? d.stakePreview ?? "—"}</p>
                </div>
                <div className="flex gap-2">
                  <GameButton variant="gold" size="sm">Accept</GameButton>
                  <GameButton variant="secondary" size="sm">Decline</GameButton>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </section>
    </GameHubLayout>
  );
}
