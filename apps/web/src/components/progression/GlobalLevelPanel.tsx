"use client";

import { motion } from "framer-motion";
import { PLAYER_PROGRESSION } from "@/data/player-progression-data";
import { GlassCard } from "@tasks-cash/ui";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { ProgressionSection } from "./ProgressionSection";

export function GlobalLevelPanel() {
  const g = PLAYER_PROGRESSION.globalLevel;
  const pct = Math.round((g.currentXp / g.requiredXp) * 100);

  return (
    <ProgressionSection
      id="global-level"
      eyebrow="◈ Core Progression ◈"
      title="Global Level"
      subtitle="Your main account level — the foundation of every reward, rank, and unlock in the arena."
    >
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <GlassCard glow="gold" className="prog-level-card border-2 border-amber-400/15 p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-12 items-center">
            <motion.div
              className="level-up-ring flex flex-col items-center justify-center rounded-2xl border-2 border-amber-400/30 bg-black/50 p-8 md:p-10 min-w-[160px]"
              animate={{ boxShadow: ["0 0 20px rgba(212,175,55,0.2)", "0 0 45px rgba(212,175,55,0.4)", "0 0 20px rgba(212,175,55,0.2)"] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/50 mb-1">Level</p>
              <p className="text-6xl md:text-7xl font-black text-amber-400 tabular-nums leading-none">{g.level}</p>
            </motion.div>

            <div className="flex-1 w-full">
              <AnimatedProgressBar
                value={g.currentXp}
                max={g.requiredXp}
                label="Experience"
                currentLabel={`${g.currentXp.toLocaleString()} / ${g.requiredXp.toLocaleString()} XP`}
                size="lg"
                glow="gold"
              />
              <p className="text-xs text-purple-400/45 mt-3 tabular-nums">{pct}% to Level {g.nextLevel}</p>

              <div className="mt-8 rounded-xl border border-amber-400/20 bg-amber-950/20 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60 mb-1">Reward at Level {g.nextLevel}</p>
                <p className="text-lg md:text-xl font-black text-amber-300">{g.nextReward}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </ProgressionSection>
  );
}
