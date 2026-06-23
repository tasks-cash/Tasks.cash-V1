"use client";

import { HERO_STATS } from "@/data/mock-data";
import { AnimatedFog } from "@/components/ui/PortalBackground";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { GlowCard } from "@/components/ui/GlowCard";
import { motion } from "framer-motion";

export function HeroSection() {
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
          ◈ Challenge Arena ◈
        </motion.p>

        <h1 className="arena-heading text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl mb-6 leading-none">
          MYSTERY
          <br />
          CHALLENGES
        </h1>

        <p className="mx-auto mb-10 max-w-4xl text-base text-purple-200/60 md:text-xl lg:text-2xl leading-relaxed px-2">
          Join timed raids. Submit viral videos. Invite friends. Complete secret missions. Climb the rankings.
        </p>

        <ArenaButton variant="gold" size="xl" className="animate-pulse-gold mb-16">
          Enter The Arena
        </ArenaButton>

        <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
          {HERO_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
            >
              <GlowCard glow={stat.glow === "gold" ? "gold" : "violet"} className="p-5 md:p-8 h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] md:text-xs uppercase tracking-widest text-purple-400/60 font-semibold">
                    {stat.label}
                  </span>
                  <span className="text-2xl md:text-3xl">{stat.icon}</span>
                </div>
                <p
                  className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tabular-nums ${
                    stat.glow === "gold" ? "text-amber-400" : "text-white"
                  }`}
                >
                  {stat.value}
                </p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <span className="text-[10px] uppercase tracking-[0.4em] text-purple-400/40">Scroll</span>
        <div className="h-12 w-px bg-gradient-to-b from-purple-500/60 to-transparent" />
      </motion.div>
    </section>
  );
}
