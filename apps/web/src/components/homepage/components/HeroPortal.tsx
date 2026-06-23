"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BrandLogo, GameButton } from "@tasks-cash/ui";

/** Cinematic full-viewport hero with portal, character, and epic CTAs */
export function HeroPortal() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 20 });
  const sy = useSpring(my, { stiffness: 50, damping: 20 });
  const portalX = useTransform(sx, [-0.5, 0.5], [-15, 15]);
  const portalY = useTransform(sy, [-0.5, 0.5], [-10, 10]);

  return (
    <section className="relative w-full min-h-[100svh] flex flex-col justify-center overflow-hidden pt-24 pb-16">
      {/* Hero ambient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/30 via-black to-black" />
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(140vw,900px)] h-[min(140vw,900px)] rounded-full opacity-40"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, rgba(168,85,247,0.1) 40%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-4 items-center min-h-[calc(100svh-8rem)]">
          {/* Copy column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 xl:col-span-5 text-center lg:text-left"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              mx.set((e.clientX - rect.left) / rect.width - 0.5);
              my.set((e.clientY - rect.top) / rect.height - 0.5);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-6 flex justify-center lg:justify-start"
            >
              <BrandLogo size="xl" href="/" showTagline animated />
            </motion.div>

            <motion.p
              className="mb-4 text-[10px] sm:text-xs uppercase tracking-[0.5em] text-violet-400/90 font-[family-name:var(--font-orbitron)] font-bold"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Premium AAA Game Universe
            </motion.p>

            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl 2xl:text-8xl font-black leading-[0.95] mb-6 font-[family-name:var(--font-cinzel)]">
              <span className="block text-white hp-title-glow">Enter The</span>
              <span className="block bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
                Dimensional Portal
              </span>
            </h1>

            <p className="text-base md:text-xl text-purple-200/55 mb-8 max-w-xl mx-auto lg:mx-0 font-[family-name:var(--font-inter)] leading-relaxed">
              Complete epic missions. Earn legendary rewards. Ascend through infinite worlds.
              The first million explorers claim founder status.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <Link href="/register">
                <GameButton variant="gold" size="lg" pulse className="hp-btn-glow w-full sm:w-auto px-10 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
                  Start Your Journey
                </GameButton>
              </Link>
              <Link href="/worlds">
                <GameButton variant="purple" size="lg" className="w-full sm:w-auto px-10 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
                  Explore Worlds
                </GameButton>
              </Link>
            </div>
          </motion.div>

          {/* Portal + character column */}
          <div className="lg:col-span-7 xl:col-span-7 relative flex items-center justify-center min-h-[400px] lg:min-h-[600px]">
            <motion.div style={{ x: portalX, y: portalY }} className="relative w-full max-w-[600px] aspect-square">
              {/* Outer rings */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-500/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-[8%] rounded-full border border-amber-400/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />

              {/* Giant animated portal */}
              <motion.div
                className="absolute inset-[15%] rounded-full hp-portal-core"
                animate={{
                  boxShadow: [
                    "0 0 60px rgba(124,58,237,0.5), inset 0 0 80px rgba(168,85,247,0.3)",
                    "0 0 120px rgba(168,85,247,0.7), inset 0 0 100px rgba(212,175,55,0.2)",
                    "0 0 60px rgba(124,58,237,0.5), inset 0 0 80px rgba(168,85,247,0.3)",
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-600/40 via-purple-900/60 to-black animate-portal-spin opacity-80" />
                <div className="absolute inset-[20%] rounded-full bg-black/80 border border-violet-400/30" />
                <motion.div
                  className="absolute inset-[35%] rounded-full bg-gradient-radial from-violet-400/60 to-transparent"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              </motion.div>

              {/* Lightning bolts */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 h-32 w-px origin-bottom bg-gradient-to-t from-violet-400/80 to-transparent"
                  style={{ rotate: `${i * 120}deg`, translateX: "-50%", translateY: "-100%" }}
                  animate={{ opacity: [0, 0.8, 0], scaleY: [0.5, 1.2, 0.5] }}
                  transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2 + i, delay: i * 0.7 }}
                />
              ))}

              {/* Character silhouette facing portal */}
              <motion.div
                className="absolute bottom-[5%] left-1/2 -translate-x-1/2 z-20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <svg viewBox="0 0 120 200" className="w-24 sm:w-32 md:w-40 h-auto drop-shadow-[0_0_30px_rgba(124,58,237,0.6)]" aria-hidden>
                  <defs>
                    <linearGradient id="charGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#1a0533" />
                    </linearGradient>
                  </defs>
                  {/* Cape */}
                  <path d="M40 80 Q60 120 35 190 Q60 170 85 190 Q60 120 80 80 Z" fill="url(#charGrad)" opacity="0.8" />
                  {/* Body */}
                  <ellipse cx="60" cy="70" rx="18" ry="22" fill="#2d1b4e" stroke="#7c3aed" strokeWidth="1" />
                  {/* Head */}
                  <circle cx="60" cy="35" r="16" fill="#1a0533" stroke="#d4af37" strokeWidth="1.5" />
                  {/* Shoulders/armor */}
                  <path d="M35 65 L25 90 L40 85 Z M85 65 L95 90 L80 85 Z" fill="#4c1d95" stroke="#a855f7" strokeWidth="0.5" />
                  {/* Sword glow */}
                  <rect x="88" y="50" width="4" height="60" rx="2" fill="url(#charGrad)" transform="rotate(15 90 80)" />
                </svg>
              </motion.div>

              {/* HUD corners */}
              <div className="absolute top-4 left-4 w-8 h-8 homepage-hud-corner homepage-hud-top-left" />
              <div className="absolute top-4 right-4 w-8 h-8 homepage-hud-corner homepage-hud-top-right" />
              <div className="absolute bottom-4 left-4 w-8 h-8 homepage-hud-corner homepage-hud-bottom-left" />
              <div className="absolute bottom-4 right-4 w-8 h-8 homepage-hud-corner homepage-hud-bottom-right" />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-[9px] uppercase tracking-[0.4em] text-purple-400/40 font-[family-name:var(--font-orbitron)]">Descend</span>
        <div className="h-12 w-px bg-gradient-to-b from-violet-500/60 to-transparent" />
      </motion.div>
    </section>
  );
}
