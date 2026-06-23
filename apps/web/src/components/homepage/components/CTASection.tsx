"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo, GameButton } from "@tasks-cash/ui";

export function CTASection() {
  return (
    <section className="relative w-full py-32 md:py-48 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/40 to-black" />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(120vw,800px)] h-[min(120vw,800px)] rounded-full border border-purple-500/10"
        animate={{ rotate: 360, scale: [1, 1.05, 1] }}
        transition={{
          rotate: { duration: 40, repeat: Infinity, ease: "linear" },
          scale: { duration: 8, repeat: Infinity },
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 text-center"
      >
        <BrandLogo size="lg" href="/" showTagline className="mx-auto mb-10" animated />

        <p className="mb-6 text-sm uppercase tracking-[0.5em] text-violet-400/70 font-[family-name:var(--font-orbitron)] font-bold animate-pulse">
          ◈ The Portal Is Open ◈
        </p>

        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 font-[family-name:var(--font-cinzel)] hp-title-gold leading-tight">
          Your Legend<br />Starts Now
        </h2>

        <p className="mx-auto max-w-2xl text-lg md:text-xl text-purple-200/50 mb-12 font-[family-name:var(--font-inter)]">
          Join 847,000+ explorers before the first million closes. Enter a universe where every mission matters.
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
          <Link href="/register">
            <GameButton variant="gold" size="lg" pulse className="hp-btn-glow px-12 py-4 font-[family-name:var(--font-rajdhani)] uppercase tracking-widest text-lg">
              Start Your Journey
            </GameButton>
          </Link>
          <Link href="/register">
            <GameButton variant="purple" size="lg" className="px-12 py-4 font-[family-name:var(--font-rajdhani)] uppercase tracking-widest text-lg">
              Create Account
            </GameButton>
          </Link>
          <Link href="/community">
            <GameButton variant="secondary" size="lg" className="px-12 py-4 font-[family-name:var(--font-rajdhani)] uppercase tracking-widest text-lg">
              Join Community
            </GameButton>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
