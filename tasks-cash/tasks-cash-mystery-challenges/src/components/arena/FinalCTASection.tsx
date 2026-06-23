"use client";

import { AnimatedFog } from "@/components/ui/PortalBackground";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { motion } from "framer-motion";

export function FinalCTASection() {
  return (
    <section className="arena-screen relative flex min-h-screen w-screen flex-col items-center justify-center overflow-hidden px-[clamp(1rem,4vw,3rem)] py-[clamp(3rem,8vw,6rem)]">
      <AnimatedFog />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[min(90vw,700px)] w-[min(90vw,700px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-purple-500/15 opacity-30"
        animate={{ rotate: 360, scale: [1, 1.08, 1] }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: "linear" },
          scale: { duration: 8, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/10 blur-[100px]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full text-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image/main_logo.png"
          alt="Tasks.cash"
          className="mx-auto mb-10 h-20 w-auto object-contain md:h-28 drop-shadow-[0_0_25px_rgba(124,58,237,0.5)]"
          draggable={false}
        />

        <p className="arena-subheading mb-6 animate-pulse">◈ Final Call ◈</p>

        <h2 className="arena-heading text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl mb-6 leading-tight">
          The next champion
          <br />
          could be you.
        </h2>

        <p className="mx-auto mb-12 max-w-2xl text-purple-200/50 text-base md:text-xl leading-relaxed">
          Enter the arena now. Compete in raids, missions, and referral wars. Claim your place among portal legends.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          <ArenaButton variant="gold" size="xl" className="animate-pulse-gold">
            Enter The Arena
          </ArenaButton>
          <ArenaButton variant="purple" size="xl">
            View Leaderboards
          </ArenaButton>
        </div>

        <p className="mt-16 text-purple-400/30 text-xs uppercase tracking-[0.4em]">
          challenge.tasks.cash · Tasks.cash Mystery Challenges
        </p>
      </motion.div>
    </section>
  );
}
