"use client";

import { motion } from "framer-motion";
import type { PlayerTitle } from "@/types/player-progression";
import { RARITY_CLASS } from "@/data/player-progression-data";
import { GlassCard } from "@tasks-cash/ui";
import { ProgressionSection } from "./ProgressionSection";
import { cn } from "@/lib/utils";

function TitleCard({ title, index }: { title: PlayerTitle; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      whileHover={title.unlocked ? { y: -4 } : undefined}
    >
      <GlassCard
        glow={title.active ? "gold" : title.unlocked ? "violet" : "none"}
        className={cn(
          "prog-title-card p-5 md:p-6 text-center h-full",
          !title.unlocked && "opacity-45 grayscale",
          title.active && "border-2 border-amber-400/30"
        )}
      >
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-3", RARITY_CLASS[title.rarity])}>
          {title.rarity}
        </span>
        <h3 className="text-lg font-black text-white mb-2">{title.name}</h3>
        <p className="text-xs text-purple-300/45 mb-3">{title.description}</p>
        {title.active && <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Equipped</p>}
        {title.unlocked && !title.active && <p className="text-[10px] uppercase tracking-widest text-emerald-400/70">Unlocked</p>}
        {!title.unlocked && <p className="text-[10px] uppercase tracking-widest text-purple-500/40">Locked</p>}
      </GlassCard>
    </motion.div>
  );
}

export function TitlesPanel({ titles }: { titles: PlayerTitle[] }) {
  return (
    <ProgressionSection
      id="titles"
      eyebrow="◈ Identity ◈"
      title="Title System"
      subtitle="Unlock titles through mastery. Your active title appears beside your username across the arena."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {titles.map((t, i) => (
          <TitleCard key={t.id} title={t} index={i} />
        ))}
      </div>
    </ProgressionSection>
  );
}
