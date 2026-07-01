"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { GlassCard, GameButton } from "@tasks-cash/ui";
import { RAID_RULES, formatRaidCountdown } from "@/data/raid-arena-data";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type RaidEventApi = {
  id: string;
  title: string;
  description?: string;
  phase: "live" | "upcoming" | "past";
  rewardPreview?: string;
  participantCount?: number;
  maxParticipants?: number;
  startsAt?: string;
  endsAt?: string;
};

function RaidCountdown({ endsAt }: { endsAt: string }) {
  const [text, setText] = useState("--:--:--");

  useEffect(() => {
    const end = new Date(endsAt);
    const tick = () => setText(formatRaidCountdown(end));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <motion.p className="text-lg font-black font-mono text-amber-400 tabular-nums" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
      {text}
    </motion.p>
  );
}

const PHASE_LABELS = { live: "Live Raids", upcoming: "Upcoming Raids", past: "Past Raids" };

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function RaidArenaPage() {
  const [events, setEvents] = useState<RaidEventApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await apiFetch<{ events: RaidEventApi[] }>("/api/raids");
      if (res.success && res.data) {
        setEvents(res.data.events ?? []);
      } else {
        setError(res.error ?? "Failed to load raids");
      }
      setLoading(false);
    }
    load();
  }, []);

  const live = events.filter((r) => r.phase === "live");
  const upcoming = events.filter((r) => r.phase === "upcoming");
  const past = events.filter((r) => r.phase === "past");

  return (
    <GameHubLayout
      breadcrumb="Hub · Raid Arena"
      eyebrow="Timed Group Challenges"
      title="RAID ARENA"
      subtitle="Join timed raids, compete during live windows, and win daily rewards."
    >
      {loading && <p className="text-purple-400/50 text-sm mb-6">Loading raids…</p>}
      {error && !loading && <p className="text-amber-400 text-sm mb-6">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <GlassCard className="p-8 text-center text-purple-400/60 mb-10">No raid events available yet.</GlassCard>
      )}

      {([["live", live], ["upcoming", upcoming], ["past", past]] as const).map(([phase, raids]) =>
        raids.length === 0 ? null : (
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
                    <h4 className="text-lg font-black text-white">{raid.title}</h4>
                    {phase === "live" && (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-950/40 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-300 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  {raid.description && <p className="text-xs text-purple-300/55 mb-3">{raid.description}</p>}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div><span className="text-purple-400/50 block">Start</span><p className="text-white font-semibold">{formatDate(raid.startsAt)}</p></div>
                    <div><span className="text-purple-400/50 block">End</span><p className="text-white font-semibold">{formatDate(raid.endsAt)}</p></div>
                    <div><span className="text-purple-400/50 block">Players Joined</span><p className="text-white">{raid.participantCount ?? 0}/{raid.maxParticipants ?? "—"}</p></div>
                    <div><span className="text-purple-400/50 block">Reward Pool</span><p className="text-amber-400 font-bold">{raid.rewardPreview ?? "—"}</p></div>
                  </div>
                  {phase === "live" && raid.endsAt && (
                    <div className="rounded-lg border border-amber-400/20 bg-black/40 p-3 mb-4 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-purple-400/50 mb-1">Countdown</p>
                      <RaidCountdown endsAt={raid.endsAt} />
                    </div>
                  )}
                  {phase !== "past" && (
                    <GameButton variant={phase === "live" ? "gold" : "purple"} size="sm" className="w-full" pulse={phase === "live"}>
                      {phase === "live" ? "Join Raid" : "Register Interest"}
                    </GameButton>
                  )}
                </GlassCard>
              ))}
            </div>
          </section>
        )
      )}

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
