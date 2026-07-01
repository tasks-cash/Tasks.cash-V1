"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import type { WinnerEntry } from "@/types/challenges-arena";
import { RANK_STYLES } from "@/data/challenges-arena-data";
import { cn } from "@/lib/utils";

interface WinnerCardProps {
  entry: WinnerEntry;
  compact?: boolean;
}

export function WinnerCard({ entry, compact }: WinnerCardProps) {
  const rankStyle = RANK_STYLES[entry.rank] ?? {
    border: "border-purple-500/20",
    glow: "",
    label: "text-purple-300",
  };
  const isTop3 = entry.rank <= 3;

  return (
    <motion.div whileHover={{ y: isTop3 ? -6 : -3 }} transition={{ duration: 0.25 }}>
      <GlassCard
        glow={entry.rank === 1 ? "gold" : entry.rank === 2 ? "none" : entry.rank === 3 ? "violet" : "purple"}
        className={cn(
          "arena-winner-card game-card-padding transition-all duration-300",
          rankStyle.border,
          rankStyle.glow,
          isTop3 && "arena-podium-card"
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-black text-lg",
              isTop3 ? rankStyle.border : "border-purple-500/25 bg-black/50",
              rankStyle.label
            )}
          >
            #{entry.rank}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{entry.avatar}</span>
              <div className="min-w-0">
                <p className="card-title text-xl truncate">{entry.username}</p>
                <p className="game-label text-amber-400/80 mt-1">{entry.title}</p>
              </div>
            </div>

            {!compact && (
              <>
                <p className="game-label mb-3">
                  Lv {entry.level} · {entry.category}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="game-badge rounded-md border border-amber-400/25 bg-amber-950/30 px-3 py-1 currency-gold">
                    {entry.reward}
                  </span>
                  <span className="game-badge rounded-md border border-purple-500/25 bg-purple-950/30 px-3 py-1 text-purple-200">
                    {entry.badge}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
