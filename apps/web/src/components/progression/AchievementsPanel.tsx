"use client";

import { motion } from "framer-motion";
import type { AchievementCategory } from "@/types/player-progression";
import { GlassCard } from "@tasks-cash/ui";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { ProgressionSection } from "./ProgressionSection";
import { cn } from "@/lib/utils";

function CategoryCard({ cat, index }: { cat: AchievementCategory; index: number }) {
  const pct = Math.round((cat.unlocked / cat.total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <GlassCard glow="purple" className="prog-achievement-card p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{cat.icon}</span>
          <div>
            <h3 className="font-black text-white">{cat.name}</h3>
            <p className="text-xs text-purple-400/50">
              {cat.unlocked}/{cat.total} unlocked · {pct}%
            </p>
          </div>
        </div>
        <AnimatedProgressBar value={cat.unlocked} max={cat.total} size="sm" className="mb-4" />
        <div className="space-y-2">
          {cat.highlights.map((h) => (
            <div
              key={h.name}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                h.unlocked ? "bg-emerald-950/25 border border-emerald-500/20 text-emerald-300/90" : "bg-black/30 border border-purple-500/10 text-purple-500/40"
              )}
            >
              <span>{h.unlocked ? "✓" : "○"}</span>
              <span className="font-semibold truncate">{h.name}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function AchievementsPanel({ categories }: { categories: AchievementCategory[] }) {
  const totalUnlocked = categories.reduce((s, c) => s + c.unlocked, 0);
  const totalAll = categories.reduce((s, c) => s + c.total, 0);
  const overallPct = Math.round((totalUnlocked / totalAll) * 100);

  return (
    <ProgressionSection
      id="achievements"
      eyebrow="◈ Milestones ◈"
      title="Achievement System"
      subtitle={`${overallPct}% complete across all categories — locked achievements remain visible as goals.`}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {categories.map((c, i) => (
          <CategoryCard key={c.id} cat={c} index={i} />
        ))}
      </div>
    </ProgressionSection>
  );
}
