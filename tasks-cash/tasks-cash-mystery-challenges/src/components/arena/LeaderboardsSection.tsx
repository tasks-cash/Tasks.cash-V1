"use client";

import { useState } from "react";
import { LEADERBOARD_TABS, LEADERBOARD_DATA } from "@/data/mock-data";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function LeaderboardsSection() {
  const [tab, setTab] = useState<(typeof LEADERBOARD_TABS)[number]>("Today");
  const entries = LEADERBOARD_DATA[tab];

  return (
    <SectionShell
      id="leaderboards"
      eyebrow="Rankings"
      title="Leaderboards"
      subtitle="Climb the arena. Today, this week, this month, or the entire season."
    >
      <div className="flex flex-wrap gap-2 mb-8">
        {LEADERBOARD_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-xl border px-5 py-2.5 text-xs md:text-sm font-bold uppercase tracking-wider transition-all",
              tab === t
                ? "border-violet-400/50 bg-violet-950/40 text-white shadow-glow-violet"
                : "border-purple-500/20 bg-black/40 text-purple-400/60 hover:border-purple-400/30"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
        >
          <GlowCard glow="violet" hover={false} className="overflow-hidden">
            <div className="divide-y divide-purple-500/10">
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={cn(
                    "flex items-center gap-4 md:gap-6 px-4 py-5 md:px-8 md:py-6 transition-colors hover:bg-purple-950/30",
                    entry.rank === 1 && "bg-amber-950/20"
                  )}
                >
                  <span
                    className={cn(
                      "w-10 md:w-12 text-center text-xl md:text-2xl font-black",
                      entry.rank === 1 ? "text-amber-400" : entry.rank <= 3 ? "text-purple-200" : "text-purple-400/60"
                    )}
                  >
                    #{entry.rank}
                  </span>
                  <span className="text-2xl md:text-3xl">{entry.badge}</span>
                  <span className="flex-1 font-bold text-white text-base md:text-lg truncate">{entry.name}</span>
                  <span className="font-black text-amber-400 text-lg md:text-xl tabular-nums">
                    {entry.score.toLocaleString()} XP
                  </span>
                </motion.div>
              ))}
            </div>
          </GlowCard>
        </motion.div>
      </AnimatePresence>
    </SectionShell>
  );
}
