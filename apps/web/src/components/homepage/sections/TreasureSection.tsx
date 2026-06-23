"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameButton } from "@tasks-cash/ui";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionTitle } from "../components/SectionTitle";
import { TREASURE_ITEMS, RARITY_COLORS } from "../data/homepage-data";

interface TreasureCardProps {
  name: string;
  rarity: string;
  icon: string;
  glow: string;
}

export function TreasureCard({ name, rarity, icon, glow }: TreasureCardProps) {
  const isLegendary = rarity === "legendary";

  return (
    <motion.div
      whileHover={{ y: -10, rotateY: 5 }}
      transition={{ type: "spring", stiffness: 200, damping: 18 }}
      className={`hp-treasure-card group relative rounded-2xl border p-6 text-center overflow-hidden ${
        isLegendary ? "border-amber-400/40 animate-pulse-gold" : "border-purple-500/25"
      } bg-gradient-to-br from-purple-950/40 to-black/80`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-violet-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <motion.div
        className="relative z-10 text-6xl md:text-7xl mb-4 drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]"
        animate={isLegendary ? { y: [0, -8, 0] } : undefined}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {icon}
      </motion.div>
      <span className={`relative z-10 inline-block px-3 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest mb-2 ${RARITY_COLORS[rarity] ?? RARITY_COLORS.rare}`}>
        {rarity}
      </span>
      <h3 className="relative z-10 text-lg font-black text-white font-[family-name:var(--font-cinzel)]">{name}</h3>
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
        glow === "gold" ? "shadow-glow-gold" : "shadow-glow-purple"
      }`} />
    </motion.div>
  );
}

export function TreasureSection() {
  return (
    <CinematicSection id="treasure" glow="gold" parallax>
      <SectionTitle
        eyebrow="Treasure System"
        title="Legendary Artifacts"
        subtitle="Open chests, discover rare items, and build your portal collection."
      />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {TREASURE_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <TreasureCard {...item} />
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link href="/treasure">
          <GameButton variant="gold" size="lg" pulse className="hp-btn-glow font-[family-name:var(--font-rajdhani)] uppercase tracking-widest px-12">
            Open Treasure
          </GameButton>
        </Link>
      </div>
    </CinematicSection>
  );
}
