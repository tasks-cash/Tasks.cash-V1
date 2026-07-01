"use client";

import { motion } from "framer-motion";
import { PLAYER_PROGRESSION, getActiveTitle, getRankById, RANK_COLOR_CLASS } from "@/data/player-progression-data";
import type { PlayerProgressionData } from "@/types/player-progression";
import { GlassCard } from "@tasks-cash/ui";
import { cn } from "@/lib/utils";

export function ProgressionHeroHeader({ data = PLAYER_PROGRESSION }: { data?: PlayerProgressionData }) {
  const { profile } = data;
  const rank = getRankById(profile.currentRankId);
  const nextRank = getRankById(profile.nextRankId);
  const title = getActiveTitle(data);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="prog-hero relative w-full mb-10 md:mb-14"
    >
      <GlassCard glow="gold" className="prog-hero-card border-2 border-amber-400/15 p-6 md:p-10 lg:p-12 overflow-hidden">
        <div className="prog-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-8">
          <motion.div
            animate={{ boxShadow: ["0 0 20px rgba(124,58,237,0.3)", "0 0 40px rgba(212,175,55,0.35)", "0 0 20px rgba(124,58,237,0.3)"] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="flex h-24 w-24 md:h-28 md:w-28 shrink-0 items-center justify-center rounded-2xl border-2 border-purple-500/30 bg-black/50 text-5xl md:text-6xl"
          >
            {profile.avatar}
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-4xl font-black text-white">{profile.username}</h1>
              {title && (
                <span className={cn("inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider", RANK_COLOR_CLASS.violet)}>
                  {title.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={cn("inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-black", RANK_COLOR_CLASS[rank.color])}>
                <span className="text-lg">{rank.icon}</span>
                {rank.name}
              </span>
              <span className="text-xs text-purple-400/50">Joined {profile.joinDate}</span>
            </div>
            <p className="text-sm text-purple-200/55 max-w-2xl">{rank.description}</p>
            <p className="text-xs text-amber-400/70 mt-2">
              {profile.rankProgress}% toward {nextRank.name}
            </p>
          </div>

          <div className="shrink-0 text-center lg:text-right">
            <p className="text-[10px] uppercase tracking-[0.25em] text-purple-400/50 mb-1">Overall Completion</p>
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="text-5xl md:text-6xl font-black text-amber-400 tabular-nums"
            >
              {data.overallCompletion}%
            </motion.p>
          </div>
        </div>
      </GlassCard>
    </motion.header>
  );
}
