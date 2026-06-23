"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./lib/utils";

interface RewardCardProps {
  title: string;
  description?: string;
  value?: string | number;
  rarity?: "common" | "rare" | "epic" | "legendary";
  icon?: string;
  className?: string;
  onClaim?: () => void;
  claimed?: boolean;
}

const RARITY_STYLES = {
  common: "border-slate-500/30 from-slate-950/50",
  rare: "border-blue-500/30 from-blue-950/40 shadow-[0_0_15px_rgba(59,130,246,0.2)]",
  epic: "border-purple-500/40 from-purple-950/50 shadow-glow-purple",
  legendary: "border-amber-400/40 from-amber-950/40 shadow-glow-gold animate-pulse-gold",
};

/** Treasure / reward chest card */
export function RewardCard({
  title,
  description,
  value,
  rarity = "epic",
  icon = "🎁",
  className,
  onClaim,
  claimed,
}: RewardCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, rotateX: 2 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={cn(
        "relative rounded-2xl border p-5 backdrop-blur-xl",
        "bg-gradient-to-br to-black/70",
        RARITY_STYLES[rarity],
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-black/40 text-3xl">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase tracking-widest text-purple-400/60">{rarity}</span>
          <h3 className="text-lg font-bold text-white mt-0.5">{title}</h3>
          {description && <p className="text-sm text-purple-200/60 mt-1 line-clamp-2">{description}</p>}
          {value !== undefined && (
            <p className="text-amber-400 font-black text-xl mt-2">{value}</p>
          )}
        </div>
      </div>
      {onClaim && (
        <button
          type="button"
          onClick={onClaim}
          disabled={claimed}
          data-sound="reward-claim"
          className={cn(
            "mt-4 w-full rounded-xl py-2 text-sm font-bold transition-all",
            claimed
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-400/30"
              : "bg-gradient-to-r from-amber-500 to-yellow-600 text-black hover:from-amber-400 hover:to-yellow-500"
          )}
        >
          {claimed ? "✓ Claimed" : "Open Treasure"}
        </button>
      )}
    </motion.div>
  );
}
