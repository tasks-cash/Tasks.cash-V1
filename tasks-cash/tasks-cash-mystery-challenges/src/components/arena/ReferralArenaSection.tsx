"use client";

import { useState } from "react";
import { REFERRAL_CHAMPIONS } from "@/data/mock-data";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Period = "daily" | "weekly" | "monthly";

const TABS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export function ReferralArenaSection() {
  const [period, setPeriod] = useState<Period>("daily");
  const champions = REFERRAL_CHAMPIONS[period];

  return (
    <SectionShell
      id="referral-arena"
      eyebrow="Mode 02"
      title="Referral Arena"
      subtitle="Recruit allies. Dominate daily, weekly, and monthly referral leaderboards."
    >
      <div className="flex flex-wrap gap-3 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setPeriod(tab.key)}
            className={cn(
              "rounded-xl border px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all",
              period === tab.key
                ? "border-amber-400/50 bg-amber-950/40 text-amber-300 shadow-glow-gold"
                : "border-purple-500/25 bg-black/40 text-purple-400/60 hover:border-purple-400/40"
            )}
          >
            {tab.label} Champions
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={period}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35 }}
          className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:gap-6"
        >
          {champions.map((c, i) => (
            <GlowCard
              key={c.rank}
              glow={i === 0 ? "gold" : "violet"}
              className={cn("p-6 md:p-8", i === 0 && "md:scale-105 md:-translate-y-2")}
            >
              <div className="flex items-center gap-4 mb-4">
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black",
                    i === 0 ? "border-amber-400 text-amber-400 bg-amber-950/40" : "border-purple-500/40 text-purple-300"
                  )}
                >
                  #{c.rank}
                </span>
                <div>
                  <p className="font-black text-white text-lg md:text-xl">{c.name}</p>
                  <p className="text-purple-400/60 text-sm">{c.referrals} referrals</p>
                </div>
              </div>
              <p className="text-amber-400 font-black text-2xl md:text-3xl">{c.reward}</p>
            </GlowCard>
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex flex-wrap gap-4">
        <ArenaButton variant="gold" size="lg">Share Referral Link</ArenaButton>
        <ArenaButton variant="purple" size="lg">View Full Rankings</ArenaButton>
      </div>
    </SectionShell>
  );
}
