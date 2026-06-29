"use client";

import { motion } from "framer-motion";
import type { ProgressionBadge } from "@/types/player-progression";
import { RARITY_CLASS } from "@/data/player-progression-data";
import { GlassCard } from "@tasks-cash/ui";
import { ProgressionSection } from "./ProgressionSection";
import { cn } from "@/lib/utils";

function BadgeCard({ badge, index }: { badge: ProgressionBadge; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04 }}
      whileHover={badge.unlocked ? { scale: 1.04, y: -4 } : undefined}
    >
      <GlassCard
        glow={badge.unlocked ? (badge.rarity === "legendary" ? "gold" : "violet") : "none"}
        className={cn(
          "prog-badge-card relative p-5 md:p-6 text-center h-full overflow-hidden",
          !badge.unlocked && "opacity-50",
          badge.unlocked && badge.rarity === "legendary" && "badge-unlock-glow"
        )}
      >
        {badge.unlocked && (
          <motion.div
            className="badge-shine pointer-events-none absolute inset-0"
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.2 }}
            aria-hidden
          />
        )}
        {!badge.unlocked && <span className="absolute top-3 right-3 text-sm opacity-40">🔒</span>}
        <motion.div
          className={cn(
            "relative mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl",
            badge.unlocked ? "border-amber-400/30 bg-black/50" : "border-purple-500/15 bg-black/40 grayscale"
          )}
          animate={
            badge.unlocked
              ? { boxShadow: ["0 0 10px rgba(212,175,55,0.2)", "0 0 25px rgba(212,175,55,0.4)", "0 0 10px rgba(212,175,55,0.2)"] }
              : undefined
          }
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          {badge.icon}
        </motion.div>
        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase mb-2", RARITY_CLASS[badge.rarity])}>
          {badge.rarity}
        </span>
        <h3 className="text-sm font-black text-white mb-1">{badge.name}</h3>
        <p className="text-[10px] text-purple-400/45 leading-snug">{badge.requirement}</p>
      </GlassCard>
    </motion.div>
  );
}

export function BadgesPanel({ badges }: { badges: ProgressionBadge[] }) {
  const unlocked = badges.filter((b) => b.unlocked).length;

  return (
    <ProgressionSection
      id="badges"
      eyebrow="◈ Collectibles ◈"
      title="Badge System"
      subtitle={`${unlocked} of ${badges.length} badges collected — permanent trophies of your arena legacy.`}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map((b, i) => (
          <BadgeCard key={b.id} badge={b} index={i} />
        ))}
      </div>
    </ProgressionSection>
  );
}
