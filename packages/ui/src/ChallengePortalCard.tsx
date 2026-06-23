"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./lib/utils";

interface ChallengePortalCardProps {
  href?: string;
  activeCount?: number;
  className?: string;
}

/** Big impressive dashboard portal to challenges arena */
export function ChallengePortalCard({ href = "/mystery-challenges", activeCount = 3, className }: ChallengePortalCardProps) {
  return (
    <a href={href} className={cn("block group hover-sound-ready", className)} data-sound="enter-challenges">
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-purple-500/30",
          "bg-gradient-to-br from-purple-900/40 via-violet-950/50 to-black/80",
          "p-6 md:p-8 min-h-[160px] cursor-pointer",
          "shadow-glow-purple hover:shadow-[0_0_40px_rgba(124,58,237,0.45)]",
          "transition-shadow duration-300"
        )}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-amber-500/10"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <div className="portal-ring absolute -right-16 -top-16 h-48 w-48 opacity-20" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center rounded-full border border-purple-400/40 bg-purple-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300 mb-3">
              Arena
            </span>
            <h3 className="text-2xl md:text-3xl font-black text-white font-[family-name:var(--font-cinzel)] mb-2">
              Enter Challenges
            </h3>
            <p className="text-purple-200/60 text-sm max-w-md">
              Compete in timed events, climb ranks, and claim legendary rewards.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <motion.span
              className="text-5xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚔️
            </motion.span>
            <span className="text-xs uppercase tracking-widest text-amber-400/80">
              {activeCount} Active
            </span>
            <motion.span
              className="text-lg text-violet-300 group-hover:translate-x-1 transition-transform"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </div>
        </div>
      </motion.div>
    </a>
  );
}
