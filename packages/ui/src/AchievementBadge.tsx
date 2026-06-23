"use client";

import React from "react";
import { motion } from "framer-motion";
import type { IAchievementDefinition, IBadgeDefinition } from "@tasks-cash/types";
import { cn } from "./lib/utils";

interface AchievementCardProps {
  achievement: IAchievementDefinition;
  unlocked?: boolean;
  unlockedAt?: string;
  className?: string;
}

export function AchievementCard({ achievement, unlocked = false, unlockedAt, className }: AchievementCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-2xl border p-4 backdrop-blur-xl transition-all",
        unlocked
          ? "border-amber-400/30 bg-gradient-to-br from-amber-950/30 to-black/60 shadow-glow-gold"
          : "border-purple-500/15 bg-black/40 opacity-60 grayscale",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <p className="font-bold text-white">{achievement.name}</p>
          <p className="text-xs text-purple-300/60 mt-1">{achievement.description}</p>
          {unlocked && unlockedAt && (
            <p className="text-[10px] text-emerald-400/70 mt-2">Unlocked {new Date(unlockedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface BadgeCardProps {
  badge: IBadgeDefinition;
  earned?: boolean;
  className?: string;
}

const TIER_GLOW: Record<string, string> = {
  bronze: "border-[#cd7f32]/40",
  silver: "border-slate-300/40",
  gold: "border-amber-400/40 shadow-glow-gold",
  diamond: "border-blue-400/40",
  legendary: "border-purple-400/40 shadow-glow-purple",
  mythic: "border-fuchsia-400/40",
  founder: "border-orange-400/40 shadow-glow-gold",
  earlyExplorer: "border-emerald-400/40",
  vip: "border-amber-300/50 shadow-glow-gold",
};

export function BadgeCard({ badge, earned = false, className }: BadgeCardProps) {
  return (
    <motion.div
      whileHover={{ scale: earned ? 1.05 : 1, rotate: earned ? 2 : 0 }}
      className={cn(
        "flex flex-col items-center rounded-2xl border p-4 text-center backdrop-blur-xl",
        earned ? TIER_GLOW[badge.tier] ?? "border-purple-500/30" : "border-purple-500/10 opacity-40 grayscale",
        "bg-black/50",
        className
      )}
    >
      <span className="text-4xl mb-2">{badge.icon}</span>
      <p className="text-sm font-bold text-white">{badge.name}</p>
      <p className="text-[10px] uppercase tracking-widest text-purple-400/50 mt-1">{badge.tier}</p>
    </motion.div>
  );
}
