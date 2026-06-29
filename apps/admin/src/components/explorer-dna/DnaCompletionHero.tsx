"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@tasks-cash/ui";
import type { ExplorerDNAProfile } from "@tasks-cash/types";

interface DnaCompletionHeroProps {
  profile: ExplorerDNAProfile;
}

export function DnaCompletionHero({ profile }: DnaCompletionHeroProps) {
  const pct = profile.completionPercent;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <GlassCard glow="gold" className="dna-completion-hero p-6 md:p-10 border-amber-400/25 mb-8 md:mb-10">
      <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-center">
        <div className="relative mx-auto">
          <svg width="160" height="160" className="-rotate-90">
            <circle cx="80" cy="80" r="54" fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth="10" />
            <motion.circle
              cx="80"
              cy="80"
              r="54"
              fill="none"
              stroke="url(#dnaProgressGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            <defs>
              <linearGradient id="dnaProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#d4af37" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-amber-400">{pct}%</span>
            <span className="text-[9px] uppercase tracking-widest text-purple-400/50">Complete</span>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/50 font-bold mb-2">Explorer DNA</p>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Your DNA Intelligence Profile</h2>
          <p className="text-purple-300/60 text-sm mb-4">
            {profile.completedModules} / {profile.totalModules} DNA Modules Completed · Intelligence Score{" "}
            <span className="text-amber-400 font-bold">{profile.intelligenceScore}</span>
          </p>

          <div className="dna-bar-track rounded-full h-3 overflow-hidden border border-purple-500/25 bg-black/50 mb-4">
            <motion.div
              className="dna-bar-fill h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className="rounded-lg border border-amber-400/25 bg-amber-950/30 px-3 py-1.5 text-amber-300">
              Next: {profile.nextReward}
            </span>
            <span className="rounded-lg border border-purple-500/20 bg-purple-950/30 px-3 py-1.5 text-purple-300">
              +{profile.totalXpEarned.toLocaleString()} DNA XP earned
            </span>
            {profile.pendingQuestions > 0 && (
              <span className="rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-1.5 text-red-300">
                {profile.pendingQuestions} new question{profile.pendingQuestions > 1 ? "s" : ""} available
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
