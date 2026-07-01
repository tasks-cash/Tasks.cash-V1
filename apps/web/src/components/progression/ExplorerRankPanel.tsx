"use client";

import { motion } from "framer-motion";
import { PLAYER_PROGRESSION, getRankById, RANK_COLOR_CLASS } from "@/data/player-progression-data";
import type { PlayerProgressionData } from "@/types/player-progression";
import { GlassCard } from "@tasks-cash/ui";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { ProgressionSection } from "./ProgressionSection";
import { cn } from "@/lib/utils";

export function ExplorerRankPanel({ data = PLAYER_PROGRESSION }: { data?: PlayerProgressionData }) {
  const { profile, ranks } = data;
  const current = getRankById(profile.currentRankId);
  const next = getRankById(profile.nextRankId);
  const currentIdx = ranks.findIndex((r) => r.id === profile.currentRankId);

  return (
    <ProgressionSection
      id="explorer-rank"
      eyebrow="◈ Account Rank ◈"
      title="Explorer Rank"
      subtitle="Your primary account rank — displayed beside your username across the entire portal."
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <GlassCard glow="violet" className="p-8 md:p-10 h-full">
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl">{current.icon}</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-purple-400/50">Current Rank</p>
                <p className={cn("text-2xl md:text-3xl font-black", RANK_COLOR_CLASS[current.color].split(" ")[0])}>{current.name}</p>
              </div>
            </div>
            <p className="text-sm text-purple-200/60 mb-6">{current.description}</p>
            <AnimatedProgressBar
              value={profile.rankProgress}
              label={`Progress to ${next.name}`}
              currentLabel={`${profile.rankProgress}%`}
              size="lg"
              glow="violet"
            />
          </GlassCard>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          {ranks.map((rank, i) => {
            const unlocked = i <= currentIdx;
            const isCurrent = rank.id === profile.currentRankId;
            return (
              <motion.div
                key={rank.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  className={cn(
                    "prog-rank-tier flex items-center gap-3 rounded-xl border p-3 md:p-4 transition-all",
                    unlocked ? RANK_COLOR_CLASS[rank.color] : "border-purple-500/10 bg-black/30 opacity-40",
                    isCurrent && "ring-1 ring-amber-400/40"
                  )}
                >
                  <span className="text-xl shrink-0">{rank.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black truncate">{rank.name}</p>
                    <p className="text-[9px] text-purple-400/40 truncate">{rank.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ProgressionSection>
  );
}
