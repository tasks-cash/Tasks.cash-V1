"use client";

import React from "react";
import { motion } from "framer-motion";
import type { IMysteryMissionView } from "@tasks-cash/types";
import {
  MYSTERY_CATEGORY_LABELS,
  MYSTERY_STATE_LABELS,
  MYSTERY_UNLOCK_LABELS,
  MYSTERY_REWARD_LABELS,
} from "@tasks-cash/types";
import { cn } from "./lib/utils";
import { PortalButton } from "./PortalButton";

interface MysteryMissionCardProps {
  mission: IMysteryMissionView;
  onStart?: (mission: IMysteryMissionView) => void;
  onReveal?: (mission: IMysteryMissionView) => void;
  /** Always show title/requirements even when locked (Mystery Mode page) */
  revealDetails?: boolean;
  /** Custom CTA label for available missions */
  actionLabel?: string;
  className?: string;
}

const STATE_STYLES: Record<string, string> = {
  locked: "border-purple-900/50 from-black/90 to-purple-950/40",
  unlocked: "border-violet-500/40 from-purple-950/50 to-black/70 shadow-glow-purple",
  in_progress: "border-amber-400/40 from-amber-950/20 to-black/70 shadow-glow-gold",
  submitted: "border-blue-500/30 from-blue-950/20 to-black/70",
  under_review: "border-cyan-500/30 from-cyan-950/20 to-black/70",
  completed: "border-emerald-500/30 from-emerald-950/20 to-black/70",
  expired: "border-red-900/30 from-red-950/10 to-black/80 opacity-60",
};

const STATUS_LABELS: Record<string, string> = {
  locked: "Locked",
  unlocked: "Available",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  completed: "Completed",
  expired: "Expired",
};

function formatRewards(mission: IMysteryMissionView, hidden: boolean) {
  if (hidden) return "Unknown Reward";
  if (mission.rewards?.length) {
    return mission.rewards
      .map((r) => {
        if (r.label) return r.label;
        return `${r.amount ? `${r.amount} ` : ""}${MYSTERY_REWARD_LABELS[r.type] ?? r.type}`;
      })
      .join(" · ");
  }
  const parts: string[] = [];
  if (mission.xpReward) parts.push(`${mission.xpReward} XP`);
  if (mission.coinReward) parts.push(`◈ ${mission.coinReward} ${mission.coinType ?? "gold"} coins`);
  return parts.join(" · ") || "Mystery Loot";
}

/** Dark vault mission card — locked missions show chains/glow */
export function MysteryMissionCard({
  mission,
  onStart,
  onReveal,
  revealDetails = false,
  actionLabel = "Begin Mission",
  className,
}: MysteryMissionCardProps) {
  const hidden = !revealDetails && (!mission.isRevealed || mission.playerState === "locked");
  const isLocked = mission.playerState === "locked";
  const isAvailable = mission.playerState === "unlocked";
  const statusLabel = STATUS_LABELS[mission.playerState] ?? MYSTERY_STATE_LABELS[mission.playerState];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={!isLocked ? { y: -4, scale: 1.005 } : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-2xl",
        "bg-gradient-to-br min-h-[200px] flex flex-col",
        STATE_STYLES[mission.playerState] ?? STATE_STYLES.locked,
        isLocked && "mystery-locked-card",
        isAvailable && "shadow-[0_0_30px_rgba(168,85,247,0.15)]",
        className
      )}
      data-sound={isLocked ? "mission-locked" : "mission-card"}
    >
      {isLocked && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-950/50 to-black/70 pointer-events-none z-[1]" />
          <div className="absolute inset-0 mystery-fog pointer-events-none z-[1]" />
          <motion.div
            className="absolute top-5 right-5 flex gap-1 text-xl opacity-50 z-[2]"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🔗⛓️
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none z-[1]"
            animate={{ boxShadow: ["inset 0 0 20px rgba(124,58,237,0.1)", "inset 0 0 40px rgba(168,85,247,0.2)", "inset 0 0 20px rgba(124,58,237,0.1)"] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </>
      )}

      {isAvailable && (
        <motion.div
          className="absolute -inset-px rounded-2xl pointer-events-none"
          animate={{ opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ boxShadow: "inset 0 0 40px rgba(168,85,247,0.25)" }}
        />
      )}

      <div className="relative z-10 p-6 md:p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.25em] text-purple-400/50">
              {MYSTERY_CATEGORY_LABELS[mission.category]}
            </span>
            <h3 className={cn("mt-1 text-lg md:text-xl font-black leading-tight", hidden ? "text-purple-300/40 blur-[2px] select-none" : "text-white")}>
              {hidden ? "???" : mission.title}
            </h3>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
              isLocked
                ? "border-purple-500/40 text-purple-400/70 bg-purple-950/50"
                : isAvailable
                  ? "border-amber-400/50 text-amber-300 bg-amber-950/30 shadow-glow-gold"
                  : "border-violet-400/40 text-violet-300"
            )}
          >
            {statusLabel}
          </span>
        </div>

        {!hidden && (
          <p className="text-sm text-purple-200/55 mb-5 leading-relaxed">{mission.description}</p>
        )}

        <div className="space-y-3 mt-auto">
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-sm">
            <span className="text-purple-400/50 uppercase tracking-wider text-xs shrink-0">Requirement</span>
            <span className={cn("text-violet-200/80", hidden && "blur-sm select-none")}>
              {hidden ? "??? ?? ???" : mission.unlockLabel ?? MYSTERY_UNLOCK_LABELS[mission.unlockCondition]}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-sm">
            <span className="text-purple-400/50 uppercase tracking-wider text-xs shrink-0">Reward</span>
            <span className={cn("font-semibold", hidden ? "text-amber-400/40" : "text-amber-400")}>
              {formatRewards(mission, hidden)}
            </span>
          </div>
        </div>

        {isAvailable && onStart && actionLabel && (
          <PortalButton
            variant="gold"
            size="md"
            className="w-full mt-6"
            onClick={() => onStart(mission)}
            data-sound="mission-start"
            pulse
          >
            {actionLabel}
          </PortalButton>
        )}

        {isLocked && onReveal && !revealDetails && (
          <PortalButton variant="ghost" size="sm" className="w-full mt-4 opacity-60" disabled data-sound="mission-locked">
            🔒 Sealed
          </PortalButton>
        )}
      </div>
    </motion.div>
  );
}
