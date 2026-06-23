"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PortalButton } from "@tasks-cash/ui";
import {
  MISSION_STATUS_LABELS,
  type MissionBoardItem,
} from "@/lib/missions-board-data";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "border-emerald-400/30 text-emerald-300 bg-emerald-950/30",
  medium: "border-yellow-400/30 text-yellow-300 bg-yellow-950/30",
  hard: "border-orange-400/30 text-orange-300 bg-orange-950/30",
  legendary: "border-amber-400/40 text-amber-300 bg-amber-950/30 animate-pulse-gold",
};

const STATUS_STYLES: Record<string, string> = {
  available: "border-violet-400/40 text-violet-200 bg-violet-950/40",
  locked: "border-purple-500/30 text-purple-400/70 bg-purple-950/30",
  under_review: "border-cyan-400/30 text-cyan-200 bg-cyan-950/30",
  completed: "border-emerald-400/30 text-emerald-300 bg-emerald-950/30",
};

interface MissionBoardCardProps {
  mission: MissionBoardItem;
  index: number;
}

/** Mystery Mode mission card — purple glow, gold accent, no extra CTAs */
export function MissionBoardCard({ mission, index }: MissionBoardCardProps) {
  const isLocked = mission.status === "locked";
  const isAvailable = mission.status === "available";

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={!isLocked ? { y: -4, scale: 1.005 } : undefined}
      className={[
        "relative overflow-hidden rounded-2xl border backdrop-blur-2xl",
        "bg-gradient-to-br from-purple-950/40 via-black/70 to-black/90",
        isAvailable
          ? "border-amber-400/35 shadow-glow-gold"
          : isLocked
            ? "border-purple-500/20 mystery-locked-card"
            : "border-purple-500/30 shadow-glow-purple",
      ].join(" ")}
    >
      {isLocked && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-950/30 to-black/50 pointer-events-none z-[1]" />
          <div className="absolute inset-0 mystery-fog pointer-events-none z-[1]" />
        </>
      )}

      {!isLocked && (
        <motion.div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ boxShadow: "inset 0 0 28px rgba(168,85,247,0.25)" }}
        />
      )}

      <div className="relative z-10 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/50 mb-2">
              Mystery Mission
            </p>
            <h3
              className={[
                "text-base md:text-lg font-black leading-snug",
                isLocked ? "text-purple-200/50" : "text-white",
              ].join(" ")}
            >
              {mission.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <span
              className={[
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                STATUS_STYLES[mission.status],
              ].join(" ")}
            >
              {MISSION_STATUS_LABELS[mission.status]}
            </span>
            <span
              className={[
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                DIFFICULTY_STYLES[mission.difficulty],
              ].join(" ")}
            >
              {mission.difficulty}
            </span>
          </div>
        </div>

        <p
          className={[
            "text-sm leading-relaxed mb-5",
            isLocked ? "text-purple-400/45 italic" : "text-purple-200/60",
          ].join(" ")}
        >
          {mission.description}
        </p>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-purple-500/15 bg-black/30 px-3 py-2.5">
            <p className="text-purple-400/50 uppercase tracking-wider mb-1">Reward Preview</p>
            <p className={isLocked ? "text-amber-400/45 font-semibold" : "text-amber-400 font-bold"}>
              {mission.rewardPreview}
            </p>
          </div>
          <div className="rounded-xl border border-purple-500/15 bg-black/30 px-3 py-2.5">
            <p className="text-purple-400/50 uppercase tracking-wider mb-1">Unlock Requirement</p>
            <p className="text-violet-200/75 leading-relaxed">{mission.unlockRequirement}</p>
          </div>
        </div>

        {isAvailable && mission.viewHref && (
          <div className="mt-5 flex justify-end">
            <Link href={mission.viewHref}>
              <PortalButton variant="ghost" size="sm" data-sound="view-mission">
                View Mission
              </PortalButton>
            </Link>
          </div>
        )}
      </div>
    </motion.article>
  );
}
