"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameButton } from "@tasks-cash/ui";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionTitle } from "../components/SectionTitle";
import { DAILY_MISSIONS } from "../data/homepage-data";

export function MissionsSection() {
  return (
    <CinematicSection id="missions" glow="gold">
      <SectionTitle
        eyebrow="Daily Missions"
        title="Epic Quests Await"
        subtitle="Complete missions to earn XP, portal coins, and exclusive rewards."
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {DAILY_MISSIONS.map((mission, i) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8 }}
            className="hp-mission-card group relative rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-950/50 to-black/80 p-6 overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 via-purple-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-violet-400/70 font-[family-name:var(--font-orbitron)]">Daily Quest</span>
            <h3 className="text-xl font-black text-white mt-2 mb-3 font-[family-name:var(--font-cinzel)]">{mission.title}</h3>
            <div className="flex gap-4 text-sm mb-4 font-[family-name:var(--font-rajdhani)] font-semibold">
              <span className="text-amber-400">◈ {mission.coins}</span>
              <span className="text-violet-300">{mission.reward}</span>
            </div>
            <div className="h-2 rounded-full bg-black/60 border border-purple-500/20 overflow-hidden mb-2">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-600 to-amber-400"
                initial={{ width: 0 }}
                whileInView={{ width: `${mission.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: i * 0.15 }}
              />
            </div>
            <p className="text-xs text-purple-400/50">{mission.progress}% Complete</p>
            {mission.done && (
              <span className="absolute top-4 right-4 text-emerald-400 text-xs font-bold uppercase tracking-wider">✓ Done</span>
            )}
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center gap-4 flex-wrap">
        <Link href="/missions">
          <GameButton variant="gold" size="lg" pulse className="hp-btn-glow font-[family-name:var(--font-rajdhani)] uppercase tracking-widest">
            Start First Mission
          </GameButton>
        </Link>
        <Link href="/challenges">
          <GameButton variant="purple" size="lg" className="font-[family-name:var(--font-rajdhani)] uppercase tracking-widest">
            View Challenges
          </GameButton>
        </Link>
      </div>
    </CinematicSection>
  );
}
