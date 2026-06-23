"use client";

import React from "react";
import { motion } from "framer-motion";
import { GameButton } from "./GameButton";
import { cn } from "./lib/utils";

interface MysteryModePortalCardProps {
  href?: string;
  secretCount?: number;
  className?: string;
}

/** Premium dashboard entry card — الوضع الغامض / Mystery Mode */
export function MysteryModePortalCard({ href = "/mystery-challenges", secretCount = 5, className }: MysteryModePortalCardProps) {
  return (
    <motion.a
      href={href}
      className={cn("block group hover-sound-ready", className)}
      data-sound="enter-mystery"
      whileHover={{ scale: 1.008, y: -4 }}
      whileTap={{ scale: 0.992 }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-violet-500/30",
          "bg-gradient-to-br from-black via-purple-950/95 to-black",
          "p-8 md:p-12 min-h-[220px] md:min-h-[260px] cursor-pointer",
          "shadow-[0_0_50px_rgba(0,0,0,0.95)] hover:shadow-[0_0_60px_rgba(168,85,247,0.35)]",
          "transition-shadow duration-500"
        )}
      >
        <div className="mystery-fog absolute inset-0 pointer-events-none opacity-80" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-purple-900/40"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <motion.div
          className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <motion.div
          className="absolute top-8 right-8 text-4xl opacity-25"
          animate={{ rotate: [0, 8, -8, 0], opacity: [0.15, 0.4, 0.15] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          ⛓️
        </motion.div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-violet-500/40 bg-violet-950/50 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-violet-300/90 mb-5">
              🌑 Secret Dimension
            </span>

            <div className="mb-4">
              <p className="text-2xl md:text-3xl font-black text-violet-200/95 mb-1 font-[family-name:var(--font-cinzel)]" dir="rtl">
                الوضع الغامض
              </p>
              <h3 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-violet-100 via-purple-400 to-amber-400/90 bg-clip-text text-transparent font-[family-name:var(--font-cinzel)] tracking-wide">
                Mystery Mode
              </h3>
            </div>

            <p className="text-lg font-semibold text-violet-300/70 mb-2" dir="rtl">
              ادخل الوضع الغامض
            </p>
            <p className="text-xl font-bold text-white/90 mb-3">Enter Mystery Mode</p>

            <p className="text-purple-300/50 text-sm md:text-base max-w-lg leading-relaxed">
              Secret missions. Hidden rewards. No distractions.
            </p>

            <p className="mt-4 text-xs uppercase tracking-widest text-violet-400/45">
              {secretCount} sealed missions await in the fog
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-3">
            <GameButton variant="gold" pulse size="lg" className="pointer-events-none min-w-[180px]" tabIndex={-1} aria-hidden>
              Enter Now
            </GameButton>
          </div>
        </div>
      </div>
    </motion.a>
  );
}
