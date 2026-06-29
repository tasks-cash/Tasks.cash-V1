"use client";

import { motion } from "framer-motion";
import type { ExplorerAttribute } from "@/types/player-progression";
import { GlassCard } from "@tasks-cash/ui";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { ProgressionSection } from "./ProgressionSection";

function AttributeCard({ attr, index }: { attr: ExplorerAttribute; index: number }) {
  const glowMap = { purple: "purple" as const, gold: "gold" as const, violet: "violet" as const, cyan: "violet" as const, rose: "purple" as const };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="h-full"
    >
      <GlassCard glow={glowMap[attr.glow]} className="prog-attr-card h-full flex flex-col p-6 md:p-7">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-xl border border-purple-500/25 bg-black/50 text-2xl"
              animate={{ boxShadow: ["0 0 8px rgba(124,58,237,0.2)", "0 0 20px rgba(168,85,247,0.35)", "0 0 8px rgba(124,58,237,0.2)"] }}
              transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.15 }}
            >
              {attr.icon}
            </motion.div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-purple-400/50">Lv {attr.level}</p>
              <h3 className="text-base md:text-lg font-black text-white">{attr.name}</h3>
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 tabular-nums">{attr.level}</p>
        </div>

        <p className="text-xs text-purple-300/50 mb-4 leading-relaxed">{attr.purpose}</p>

        <AnimatedProgressBar value={attr.progress} label="Progress" currentLabel={`${attr.progress}%`} size="md" className="mb-4" />

        <div className="grid grid-cols-2 gap-2 mb-4">
          {attr.stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-purple-500/12 bg-black/35 px-3 py-2">
              <p className="text-[9px] uppercase tracking-wider text-purple-400/45">{s.label}</p>
              <p className="text-sm font-bold text-white tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto rounded-lg border border-amber-400/15 bg-amber-950/15 px-3 py-2 mb-3">
          <p className="text-[9px] uppercase tracking-wider text-amber-400/55">Next Reward</p>
          <p className="text-xs font-semibold text-amber-300/90">{attr.nextReward}</p>
        </div>

        <details className="group">
          <summary className="text-[10px] uppercase tracking-wider text-purple-400/50 cursor-pointer hover:text-purple-300 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▸</span> How to level up
          </summary>
          <ul className="mt-2 space-y-1 pl-3">
            {attr.howToLevelUp.map((tip) => (
              <li key={tip} className="text-[11px] text-purple-300/45">• {tip}</li>
            ))}
          </ul>
        </details>
      </GlassCard>
    </motion.div>
  );
}

export function ExplorerAttributesPanel({ attributes }: { attributes: ExplorerAttribute[] }) {
  return (
    <ProgressionSection
      id="attributes"
      eyebrow="◈ Character Build ◈"
      title="Explorer Attributes"
      subtitle="Nine specialized paths that define your unique explorer over months of play — not a simple XP bar."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {attributes.map((attr, i) => (
          <AttributeCard key={attr.id} attr={attr} index={i} />
        ))}
      </div>
    </ProgressionSection>
  );
}
