"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { GlassCard, GameButton } from "@tasks-cash/ui";
import {
  RAID_EVENTS,
  RAID_RULES,
  RAID_PAST_WINNERS,
  LIVE_RAID_COUNTDOWN_END,
  formatRaidCountdown,
} from "@/data/raid-arena-data";
import { cn } from "@/lib/utils";

function RaidCountdown() {
  const [text, setText] = useState("--:--:--");

  useEffect(() => {
    const endsAt = new Date(LIVE_RAID_COUNTDOWN_END);
    const tick = () => setText(formatRaidCountdown(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.p className="text-lg font-black font-mono text-amber-400 tabular-nums" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
      {text}
    </motion.p>
  );
}

const PHASE_LABELS = { live: "Live Raids", upcoming: "Upcoming Raids", past: "Past Raids" };

export function RaidArenaPage() {
  const live = RAID_EVENTS.filter((r) => r.phase === "live");
  const upcoming = RAID_EVENTS.filter((r) => r.phase === "upcoming");
  const past = RAID_EVENTS.filter((r) => r.phase === "past");

  return (
    <GameHubLayout
      breadcrumb="Hub · Raid Arena"
      eyebrow="Timed Group Challenges"
      title="RAID ARENA"
      subtitle="Join timed raids, compete during live windows, and win daily rewards."
    >
      {([["live", live], ["upcoming", upcoming], ["past", past]] as const).map(([phase, raids]) => (
        <section key={phase} className="mb-12">
          <h3 className="text-sm uppercase tracking-[0.3em] text-purple-400/60 font-bold mb-4">{PHASE_LABELS[phase]}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {raids.map((raid) => (
              <GlassCard
                key={raid.id}
                glow={phase === "live" ? "gold" : phase === "upcoming" ? "violet" : "purple"}
                className={cn("p-5 md:p-6", phase === "live" && "border-amber-400/30")}
              >
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-black text-white">{raid.name}</h4>
                  {phase === "live" && (
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-950/40 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-300 animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div><span className="text-purple-400/50 block">Start</span><p className="text-white font-semibold">{raid.startTime}</p></div>
                  <div><span className="text-purple-400/50 block">End</span><p className="text-white font-semibold">{raid.endTime}</p></div>
                  <div><span className="text-purple-400/50 block">Players Joined</span><p className="text-white">{raid.players}/{raid.maxPlayers}</p></div>
                  <div><span className="text-purple-400/50 block">Reward Pool</span><p className="text-amber-400 font-bold">{raid.rewardPool}</p></div>
                </div>
                {phase === "live" && raid.id === "r-live-1" && (
                  <div className="rounded-lg border border-amber-400/20 bg-black/40 p-3 mb-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-purple-400/50 mb-1">Countdown</p>
                    <RaidCountdown />
                  </div>
                )}
                {raid.requirements && <p className="text-xs text-purple-300/55 mb-3">{raid.requirements}</p>}
                {phase !== "past" && (
                  <GameButton variant={phase === "live" ? "gold" : "purple"} size="sm" className="w-full" pulse={phase === "live"}>
                    {phase === "live" ? "Join Raid" : "Register Interest"}
                  </GameButton>
                )}
              </GlassCard>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-10">
        <h3 className="text-lg font-black text-white mb-4">Past Raid Winners</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {RAID_PAST_WINNERS.map((w) => (
            <GlassCard key={w.rank} glow={w.rank === 1 ? "gold" : "purple"} className="p-4 text-center">
              <span className="font-black text-amber-400 text-lg">#{w.rank}</span>
              <span className="text-2xl block my-2">{w.avatar}</span>
              <p className="font-bold text-white">{w.username}</p>
              <p className="text-xs text-purple-400/50 mt-1">Score: {w.score}</p>
              <p className="text-sm text-amber-400 font-bold mt-2">{w.reward}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <GlassCard glow="violet" className="p-5 md:p-6">
        <h3 className="text-sm font-black text-white mb-3">Raid Rules</h3>
        <ul className="grid sm:grid-cols-2 gap-2">
          {RAID_RULES.map((r) => (
            <li key={r} className="text-xs text-purple-300/60 flex gap-2"><span className="text-amber-400">◈</span>{r}</li>
          ))}
        </ul>
      </GlassCard>
    </GameHubLayout>
  );
}