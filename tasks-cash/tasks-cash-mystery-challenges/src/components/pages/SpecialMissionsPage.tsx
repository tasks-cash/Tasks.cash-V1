"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { apiFetch } from "@/lib/api/client";
import type { SpecialMission, SpecialMissionsPayload } from "@/types/special-mission";
import { cn } from "@/lib/utils";

type PageState = "loading" | "ready" | "empty" | "error";

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "border-emerald-400/35 text-emerald-300 bg-emerald-950/30",
  Medium: "border-yellow-400/35 text-yellow-300 bg-yellow-950/30",
  Hard: "border-orange-400/35 text-orange-300 bg-orange-950/30",
  Epic: "border-purple-400/35 text-purple-300 bg-purple-950/30",
  Legendary: "border-amber-400/45 text-amber-300 bg-amber-950/35",
};

const STATUS_STYLES: Record<string, string> = {
  open: "border-emerald-400/35 text-emerald-300 bg-emerald-950/25",
  in_progress: "border-sky-400/35 text-sky-300 bg-sky-950/25",
  closed: "border-red-400/35 text-red-300 bg-red-950/25",
  archived: "border-purple-400/25 text-purple-400/70 bg-purple-950/20",
};

function formatDeadline(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatRewards(m: SpecialMission): string {
  const parts: string[] = [];
  if (m.rewardXp > 0) parts.push(`+${m.rewardXp} XP`);
  if (m.bronzeCoins > 0) parts.push(`+${m.bronzeCoins} Bronze`);
  if (m.silverCoins > 0) parts.push(`+${m.silverCoins} Silver`);
  if (m.goldCoins > 0) parts.push(`+${m.goldCoins} Gold`);
  return parts.length > 0 ? parts.join(" · ") : "Rewards TBD";
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="sm-stat-card">
      <div className="sm-stat-icon" aria-hidden>
        {icon}
      </div>
      <div className="sm-stat-value">{value}</div>
      <div className="sm-stat-label">{label}</div>
    </div>
  );
}

function MissionListCard({ mission }: { mission: SpecialMission }) {
  const isLegendary = mission.difficulty === "Legendary";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={cn("sm-mission-card", isLegendary && "legendary")}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span className="text-[10px] uppercase tracking-[0.28em] text-purple-400/55 font-bold">
          {mission.category}
        </span>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <span
            className={cn(
              "sm-status-badge",
              DIFFICULTY_STYLES[mission.difficulty] ?? DIFFICULTY_STYLES.Medium
            )}
          >
            {mission.difficulty}
          </span>
          <span className={cn("sm-status-badge", STATUS_STYLES[mission.status] ?? STATUS_STYLES.open)}>
            {mission.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <h3 className="text-xl md:text-2xl font-black text-white mb-2 leading-tight">{mission.title}</h3>
      <p className="text-sm text-purple-200/65 leading-relaxed mb-4 flex-1 line-clamp-3">{mission.description}</p>

      <div className="rounded-xl border border-amber-400/20 bg-amber-950/15 px-3 py-2.5 mb-3">
        <p className="text-[9px] uppercase tracking-wider text-amber-400/60 mb-1">Reward Preview</p>
        <p className="text-sm font-bold text-amber-200">{formatRewards(mission)}</p>
      </div>

      <p className="text-xs text-purple-400/50 mb-4">
        Deadline: <span className="text-purple-200 font-semibold">{formatDeadline(mission.deadline)}</span>
      </p>

      <Link href={`/special-missions/${mission.id}`} className="block mt-auto">
        <ArenaButton variant="gold" size="md" className="w-full">
          View Mission
        </ArenaButton>
      </Link>
    </motion.article>
  );
}

export function SpecialMissionsPage() {
  const [state, setState] = useState<PageState>("loading");
  const [missions, setMissions] = useState<SpecialMission[]>([]);
  const [error, setError] = useState("");

  const loadMissions = useCallback(async () => {
    setState("loading");
    setError("");

    const res = await apiFetch<SpecialMissionsPayload>("/api/special-missions");
    if (!res.success || !res.data) {
      setState("error");
      setError(res.error ?? "Failed to load special missions");
      return;
    }

    const list = Array.isArray(res.data.missions) ? res.data.missions : [];
    setMissions(list);
    setState(list.length === 0 ? "empty" : "ready");
  }, []);

  useEffect(() => {
    void loadMissions();
  }, [loadMissions]);

  const stats = useMemo(() => {
    return {
      total: missions.length,
      open: missions.filter((m) => m.status === "open").length,
      elite: missions.filter((m) => m.difficulty === "Legendary" || m.difficulty === "Epic").length,
      categories: new Set(missions.map((m) => m.category)).size,
    };
  }, [missions]);

  return (
    <div className="special-missions-page">
      <header className="special-missions-hero relative z-10">
        <p className="arena-subheading mb-3 relative z-10">Elite Operations</p>
        <h1 className="arena-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 relative z-10">
          Special Missions
        </h1>
        <p className="text-purple-200/60 text-base md:text-lg max-w-4xl leading-relaxed relative z-10">
          Manual elite tasks assigned by portal command. Select a mission to read full details and submit proof.
        </p>
        <div className="portal-divider max-w-3xl mt-6 relative z-10" />
      </header>

      {state === "ready" && (
        <div className="sm-stats-row">
          <StatCard icon="🎯" label="Active Missions" value={stats.total} />
          <StatCard icon="✅" label="Open Now" value={stats.open} />
          <StatCard icon="👑" label="Elite Tasks" value={stats.elite} />
          <StatCard icon="📂" label="Categories" value={stats.categories} />
        </div>
      )}

      {state === "loading" && (
        <div className="sm-state-card">
          <motion.div
            className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-purple-300/60">Loading special missions from database…</p>
        </div>
      )}

      {state === "error" && (
        <div className="sm-state-card border-red-400/25">
          <p className="text-red-300 mb-4">{error}</p>
          <ArenaButton variant="gold" onClick={() => void loadMissions()}>
            Retry
          </ArenaButton>
        </div>
      )}

      {state === "empty" && (
        <div className="sm-state-card">
          <p className="text-2xl mb-3" aria-hidden>
            🛰️
          </p>
          <p className="text-purple-200 font-semibold mb-2">No special missions in the database yet.</p>
          <p className="text-sm text-purple-400/45">Check back when portal command publishes new tasks.</p>
        </div>
      )}

      {state === "ready" && (
        <div className="special-missions-grid">
          {missions.map((mission) => (
            <MissionListCard key={mission.id} mission={mission} />
          ))}
        </div>
      )}
    </div>
  );
}
