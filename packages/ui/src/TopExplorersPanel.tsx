"use client";

import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { cn } from "./lib/utils";

export interface ExplorerEntry {
  rank: number;
  username: string;
  avatar?: string;
  level: number;
  xp: number;
  rewards: string;
  badge: string;
}

interface TopExplorersPanelProps {
  title?: string;
  entries: ExplorerEntry[];
  className?: string;
}

const RANK_STYLES: Record<number, string> = {
  1: "border-amber-400/50 bg-gradient-to-r from-amber-950/40 to-black/60 shadow-glow-gold",
  2: "border-slate-400/40 bg-gradient-to-r from-slate-900/40 to-black/60",
  3: "border-orange-400/35 bg-gradient-to-r from-orange-950/30 to-black/60",
};

/** Top 10 explorers leaderboard panel */
export function TopExplorersPanel({ title = "Top 10 Explorers", entries, className }: TopExplorersPanelProps) {
  return (
    <div className={cn("rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-black/70 backdrop-blur-xl p-6", className)}>
      <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2 font-[family-name:var(--font-cinzel)]">
        <span>🏆</span> {title}
      </h3>
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.rank}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ x: 4 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-3 transition-all",
              RANK_STYLES[entry.rank] ?? "border-purple-500/15 bg-black/40"
            )}
          >
            <span className={cn("w-7 text-center font-black text-sm", entry.rank <= 3 ? "text-amber-400" : "text-purple-400")}>
              #{entry.rank}
            </span>
            <Avatar className="h-9 w-9 border border-purple-500/30">
              <AvatarFallback className="bg-purple-950 text-xs font-bold text-purple-200">
                {entry.avatar ?? entry.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate text-sm">{entry.username}</p>
              <p className="text-[10px] text-purple-400/60">
                Lv.{entry.level} · {entry.xp.toLocaleString()} XP
              </p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-xs text-amber-400/90 font-semibold">{entry.rewards}</p>
              <p className="text-[10px] text-purple-400/50">{entry.badge}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
