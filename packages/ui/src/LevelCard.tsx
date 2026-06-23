"use client";

import React from "react";
import { motion } from "framer-motion";
import type { IRPGStatProgress, RPGStatType } from "@tasks-cash/types";
import { cn } from "./lib/utils";

const LEVEL_META: Record<
  RPGStatType,
  { label: string; icon: string; color: string; glow: string }
> = {
  global: { label: "General Level", icon: "◈", color: "#fbbf24", glow: "shadow-glow-gold" },
  strength: { label: "Strength Level", icon: "💪", color: "#ef4444", glow: "shadow-[0_0_18px_rgba(239,68,68,0.3)]" },
  intelligence: { label: "Intelligence Level", icon: "🧠", color: "#3b82f6", glow: "shadow-[0_0_18px_rgba(59,130,246,0.3)]" },
  energy: { label: "Energy Level", icon: "🔋", color: "#a855f7", glow: "shadow-glow-purple" },
  life: { label: "Life Level", icon: "❤️", color: "#f87171", glow: "shadow-[0_0_18px_rgba(248,113,113,0.3)]" },
  speed: { label: "Speed Level", icon: "⚡", color: "#22d3ee", glow: "shadow-[0_0_18px_rgba(34,211,238,0.3)]" },
  luck: { label: "Luck Level", icon: "🍀", color: "#4ade80", glow: "shadow-[0_0_18px_rgba(74,222,128,0.3)]" },
  defense: { label: "Defense Level", icon: "🛡️", color: "#94a3b8", glow: "shadow-[0_0_18px_rgba(148,163,184,0.25)]" },
  reputation: { label: "Reputation Level", icon: "👑", color: "#d4af37", glow: "shadow-glow-gold" },
};

interface LevelCardProps {
  stat: RPGStatType;
  data: IRPGStatProgress;
  className?: string;
}

/** Glowing fantasy RPG level card with XP progress */
export function LevelCard({ stat, data, className }: LevelCardProps) {
  const meta = LEVEL_META[stat];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={cn(
        "relative rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-950/30 to-black/80",
        "backdrop-blur-xl p-4 overflow-hidden",
        meta.glow,
        className
      )}
    >
      <motion.div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${meta.color}33, transparent 60%)` }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-100/80">{meta.label}</span>
          </div>
          <motion.div
            key={data.level}
            initial={{ scale: 1.4, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400/50 bg-black/50"
          >
            <span className="text-sm font-black text-amber-400">{data.level}</span>
          </motion.div>
        </div>

        <div className="relative h-3 rounded-full bg-black/60 border border-purple-500/20 overflow-hidden mb-2">
          <motion.div
            className="h-full rounded-full relative"
            style={{ background: `linear-gradient(90deg, ${meta.color}, #fbbf24)` }}
            initial={{ width: 0 }}
            animate={{ width: `${data.progress}%` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="flex justify-between text-[10px] tabular-nums text-purple-400/60">
          <span>{data.xp.toLocaleString()} XP</span>
          <span>{data.xpToNextLevel.toLocaleString()} to Lv.{data.level + 1}</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Grid of dashboard level cards */
export function LevelCardGrid({
  stats,
  statKeys,
  className,
}: {
  stats: Record<RPGStatType, IRPGStatProgress>;
  statKeys: RPGStatType[];
  className?: string;
}) {
  return (
    <div className={cn("grid sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {statKeys.map((key, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.07 }}
        >
          <LevelCard stat={key} data={stats[key]} />
        </motion.div>
      ))}
    </div>
  );
}
