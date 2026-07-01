"use client";

import Link from "next/link";
import { GAME_MODES } from "@/data/mock-data";
import { SectionShell } from "@/components/ui/GlowCard";
import { GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { motion } from "framer-motion";

export function GameModeCardsSection() {
  return (
    <SectionShell
      id="game-modes"
      eyebrow="Choose Your Path"
      title="Game Modes"
      subtitle="Four legendary arenas. Each path leads to different glory and reward pools."
    >
      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:gap-8">
        {GAME_MODES.map((mode, i) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.12, duration: 0.7 }}
          >
            <GlowCard
              glow={mode.id === "referral-arena" ? "gold" : "violet"}
              className={`min-h-[320px] md:min-h-[380px] lg:min-h-[420px] p-6 md:p-10 lg:p-12 bg-gradient-to-br ${mode.accent} ${mode.border}`}
            >
              <div className="flex h-full flex-col">
                <span className="text-5xl md:text-6xl lg:text-7xl mb-6">{mode.icon}</span>
                <p className="arena-subheading mb-2">{mode.subtitle}</p>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 font-display uppercase tracking-wide">
                  {mode.title}
                </h3>
                <p className="text-purple-200/60 text-sm md:text-base lg:text-lg leading-relaxed flex-1 mb-8">
                  {mode.description}
                </p>
                <Link href={`/${mode.id}`}>
                  <ArenaButton
                    variant={mode.id === "referral-arena" ? "gold" : "purple"}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {mode.cta}
                  </ArenaButton>
                </Link>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
