"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./lib/utils";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: string | number;
  avatar?: string;
}

interface LeaderboardCardProps {
  title?: string;
  entries: LeaderboardEntry[];
  className?: string;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-amber-400 border-amber-400/40 bg-amber-950/30",
  2: "text-slate-300 border-slate-400/30 bg-slate-950/30",
  3: "text-orange-400 border-orange-400/30 bg-orange-950/20",
};

/** Leaderboard preview card */
export function LeaderboardCard({ title = "Top Explorers", entries, className }: LeaderboardCardProps) {
  return (
    <div className={cn("rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-black/70 backdrop-blur-xl p-6", className)}>
      <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
        <span>🏆</span> {title}
      </h3>
      <div className="space-y-2">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:border-purple-400/40",
              RANK_COLORS[entry.rank] ?? "border-purple-500/15 bg-black/30 text-purple-100"
            )}
          >
            <span className="w-8 text-center font-black text-lg">#{entry.rank}</span>
            <span className="text-xl">{entry.avatar ?? "⚔️"}</span>
            <span className="flex-1 font-semibold truncate">{entry.name}</span>
            <span className="font-black text-amber-400">{entry.score}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
