"use client";

import { useState } from "react";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { GlassCard, GameButton } from "@tasks-cash/ui";
import {
  DUEL_TYPES,
  PENDING_DUELS,
  ACTIVE_DUELS,
  DUEL_HISTORY,
  DUEL_CHAMPIONS,
} from "@/data/duel-arena-data";
import { cn } from "@/lib/utils";

export function DuelArenaPage() {
  const [duelType, setDuelType] = useState(DUEL_TYPES[0]);

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

      <section className="mb-10">
        <h3 className="text-lg font-black text-white mb-4">Active Duels</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {ACTIVE_DUELS.map((d) => (
            <GlassCard key={d.id} glow="gold" className="p-5 border-amber-400/25">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="text-center">
                  <span className="text-2xl block">{d.avatarA}</span>
                  <p className="font-bold text-white text-sm">{d.playerA}</p>
                  <p className="text-amber-400 font-black">{d.scoreA}</p>
                </div>
                <span className="text-purple-400/50 font-black text-lg">VS</span>
                <div className="text-center">
                  <span className="text-2xl block">{d.avatarB}</span>
                  <p className="font-bold text-white text-sm">{d.playerB}</p>
                  <p className="text-amber-400 font-black">{d.scoreB}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs justify-center">
                <span className="rounded-md border border-purple-500/20 bg-purple-950/30 px-2 py-1 text-purple-300">{d.missionType}</span>
                <span className="rounded-md border border-amber-400/20 bg-amber-950/30 px-2 py-1 text-amber-300">{d.timeLeft} left</span>
                <span className="rounded-md border border-emerald-400/20 bg-emerald-950/30 px-2 py-1 text-emerald-300">{d.reward}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h3 className="text-lg font-black text-white mb-4">Pending Duels</h3>
        <div className="space-y-3">
          {PENDING_DUELS.map((d) => (
            <GlassCard key={d.id} glow="violet" className="p-5 flex flex-wrap items-center gap-4 justify-between">
              <div>
                <p className="font-bold text-white">{d.playerA} vs {d.playerB}</p>
                <p className="text-xs text-purple-400/50 mt-1">{d.missionType} · {d.reward} · {d.timeLeft}</p>
              </div>
              <div className="flex gap-2">
                <GameButton variant="gold" size="sm">Accept</GameButton>
                <GameButton variant="secondary" size="sm">Decline</GameButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8 mb-10">
        <section>
          <h3 className="text-lg font-black text-white mb-4">Duel History</h3>
          <div className="space-y-2">
            {DUEL_HISTORY.map((h) => (
              <GlassCard key={h.id} glow="purple" className="p-4">
                <p className="text-sm text-white"><strong className="text-amber-400">{h.winner}</strong> defeated {h.loser}</p>
                <p className="text-xs text-purple-400/50 mt-1">{h.missionType} · {h.reward} · {h.date}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-lg font-black text-white mb-4">Top Duel Champions</h3>
          <div className="space-y-2">
            {DUEL_CHAMPIONS.map((w) => (
              <GlassCard
                key={w.rank}
                glow={w.rank === 1 ? "gold" : "purple"}
                className={cn("p-3 flex items-center gap-3", w.rank <= 3 && "border-amber-400/20")}
              >
                <span className={cn("w-7 font-black text-sm", w.rank <= 3 ? "text-amber-400" : "text-purple-400")}>#{w.rank}</span>
                <span className="text-xl">{w.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{w.username}</p>
                  <p className="text-[10px] text-purple-400/50">{w.title}</p>
                </div>
                <span className="text-xs font-bold text-amber-400">{w.wins}W</span>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </GameHubLayout>
  );
}