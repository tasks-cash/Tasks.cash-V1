"use client";

import React from "react";
import { motion } from "framer-motion";
import type { RPGStatType, IRPGStatProgress } from "@tasks-cash/types";
import { cn } from "./lib/utils";

interface RPGStatBarProps {
  stat: RPGStatType;
  data: IRPGStatProgress;
  label?: string;
  icon?: string;
  color?: string;
  compact?: boolean;
  animated?: boolean;
  className?: string;
}

const DEFAULT_ICONS: Record<RPGStatType, string> = {
  global: "◈",
  strength: "💪",
  intelligence: "🧠",
  speed: "⚡",
  luck: "🍀",
  life: "❤️",
  energy: "🔋",
  defense: "🛡️",
  reputation: "👑",
};

/** Animated RPG stat progress bar with level badge */
export function RPGStatBar({
  stat,
  data,
  label,
  icon,
  color = "#a855f7",
  compact = false,
  animated = true,
  className,
}: RPGStatBarProps) {
  const displayLabel = label ?? stat.charAt(0).toUpperCase() + stat.slice(1);
  const displayIcon = icon ?? DEFAULT_ICONS[stat];

  return (
    <div className={cn("rounded-xl border border-purple-500/20 bg-black/40 p-3", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{displayIcon}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-200/80">{displayLabel}</span>
        </div>
        <motion.span
          key={data.level}
          initial={animated ? { scale: 1.5, color: "#fbbf24" } : false}
          animate={{ scale: 1, color: "#fbbf24" }}
          className="text-sm font-black text-amber-400"
        >
          Lv.{data.level}
        </motion.span>
      </div>
      <div className={cn("relative rounded-full bg-purple-950/80 border border-purple-500/20 overflow-hidden", compact ? "h-1.5" : "h-2.5")}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}, #fbbf24)` }}
          initial={{ width: 0 }}
          animate={{ width: `${data.progress}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>
      {!compact && (
        <p className="text-[10px] text-purple-400/50 mt-1.5 tabular-nums">
          {data.xp.toLocaleString()} XP · {data.progress}% to next level
        </p>
      )}
    </div>
  );
}
