"use client";

import Link from "next/link";
import { HERO_STATS } from "@/data/mock-data";
import { AnimatedFog } from "@/components/ui/PortalBackground";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { GlowCard } from "@/components/ui/GlowCard";
import { useT } from "@/i18n/I18nProvider";
import { motion } from "framer-motion";

export function HeroSection() {
  const t = useT();

  return (
    <section className="arena-screen relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden px-[clamp(1rem,4vw,3rem)] py-[clamp(2rem,5vw,4rem)]">
      <AnimatedFog />
      <div className="portal-ring absolute h-[min(80vw,600px)] w-[min(80vw,600px)] opacity-15 animate-portal-spin pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full flex-col items-center text-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image/main_logo.png"
          alt="Tasks.cash"
          className="mb-8 h-24 w-auto object-contain md:h-32 lg:h-40 drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]"
          draggable={false}
        />

        <motion.p
          className="arena-subheading mb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ◈ {t("arena.title")} ◈
        </motion.p>

        <h1 className="arena-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl mb-6 leading-none">
          MYSTERY
          <br />
          CHALLENGES
        </h1>

        <p className="mx-auto mb-10 max-w-4xl text-base text-purple-200/60 md:text-xl lg:text-2xl leading-relaxed px-2">
          {t("arena.subtitle")}
        </p>

        <Link href="#game-modes" className="mb-16 inline-block">
          <ArenaButton variant="gold" size="xl" className="animate-pulse-gold">
            {t("arena.enterArena")}
          </ArenaButton>
        </Link>

        <div className="grid w-full max-w-5xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {HERO_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <GlowCard glow="violet" className="p-4 md:p-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-amber-300 font-display">{stat.value}</p>
                <p className="text-[10px] md:text-xs uppercase tracking-widest text-purple-400/60 mt-1">{stat.label}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
