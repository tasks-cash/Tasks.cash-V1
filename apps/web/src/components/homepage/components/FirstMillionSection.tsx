"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameButton } from "@tasks-cash/ui";
import { AnimatedCounter } from "../shared/AnimatedCounter";
import { HOMEPAGE_STATS } from "../data/homepage-data";

const FOUNDER_BADGES = [
  { label: "Founder Badge", icon: "👑" },
  { label: "2× XP Boost", icon: "⚡" },
  { label: "Exclusive Frame", icon: "🖼️" },
  { label: "Portal Coins", icon: "◈" },
];

export function FirstMillionSection() {
  const progress = (HOMEPAGE_STATS.registeredUsers / HOMEPAGE_STATS.registeredTarget) * 100;

  return (
    <section className="relative w-full py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-950/40 via-black to-amber-950/20" />
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(ellipse at center, rgba(212,175,55,0.15), transparent 70%)" }}
        animate={{ opacity: [0.1, 0.25, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="hp-glass-panel rounded-3xl border border-amber-400/20 p-8 md:p-12 lg:p-16 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] text-amber-400/80 font-[family-name:var(--font-orbitron)] font-bold mb-4">
                Limited Registration
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-[family-name:var(--font-cinzel)] leading-tight mb-6 hp-title-gold">
                JOIN THE FIRST<br />1,000,000 EXPLORERS
              </h2>
              <p className="text-purple-200/50 text-base md:text-lg mb-8 font-[family-name:var(--font-inter)]">
                Secure founder rewards before the portal closes to new recruits. Early explorers receive exclusive artifacts and permanent bonuses.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                {FOUNDER_BADGES.map((badge, i) => (
                  <motion.span
                    key={badge.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="hp-badge-gold inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-[family-name:var(--font-rajdhani)] font-bold uppercase tracking-wider"
                  >
                    <span>{badge.icon}</span> {badge.label}
                  </motion.span>
                ))}
              </div>

              <Link href="/register">
                <GameButton variant="gold" size="lg" pulse className="hp-btn-glow px-12 font-[family-name:var(--font-rajdhani)] uppercase tracking-widest">
                  Claim Founder Status
                </GameButton>
              </Link>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/60 font-[family-name:var(--font-orbitron)] mb-1">Registered</p>
                  <p className="text-4xl md:text-5xl font-black text-amber-400 font-[family-name:var(--font-rajdhani)]">
                    <AnimatedCounter target={HOMEPAGE_STATS.registeredUsers} />
                  </p>
                </div>
                <p className="text-purple-300/50 text-sm font-[family-name:var(--font-orbitron)]">
                  / 1,000,000
                </p>
              </div>

              <div className="relative h-4 rounded-full bg-black/60 border border-purple-500/30 overflow-hidden mb-4">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-600 via-purple-500 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progress}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
              </div>

              <p className="text-right text-sm text-violet-300/60 font-[family-name:var(--font-rajdhani)]">
                {progress.toFixed(1)}% capacity filled · {(HOMEPAGE_STATS.registeredTarget - HOMEPAGE_STATS.registeredUsers).toLocaleString()} slots remaining
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { label: "Founder Tier", value: "I" },
                  { label: "Bonus Coins", value: "500" },
                  { label: "XP Multiplier", value: "2×" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 rounded-xl border border-purple-500/20 bg-black/40">
                    <p className="text-[9px] uppercase tracking-widest text-purple-400/50 mb-1">{item.label}</p>
                    <p className="text-xl font-black text-white font-[family-name:var(--font-orbitron)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
