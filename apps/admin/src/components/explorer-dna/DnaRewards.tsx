"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@tasks-cash/ui";
import type { ExplorerDNAProfile } from "@tasks-cash/types";

interface DnaRewardsProps {
  profile: ExplorerDNAProfile;
  lastReward?: { xp: number; coins: number } | null;
}

const UNLOCKS = [
  { threshold: 75, label: "DNA Insight Badge", icon: "🏅" },
  { threshold: 80, label: "Special Challenge Access", icon: "⚔️" },
  { threshold: 90, label: "Premium Mission Unlocks", icon: "🔓" },
  { threshold: 100, label: "Elite Explorer DNA Title", icon: "👑" },
];

export function DnaRewards({ profile, lastReward }: DnaRewardsProps) {
  const nextUnlock = UNLOCKS.find((u) => profile.completionPercent < u.threshold);

  return (
    <section className="mb-10 md:mb-14">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/50 font-bold mb-2">DNA Rewards</p>
        <h2 className="text-2xl md:text-3xl font-black text-white">Rewards & Unlocks</h2>
        <p className="text-sm text-purple-300/55 mt-2">Every answer earns XP, coins, and moves you closer to exclusive missions.</p>
      </div>

      {lastReward && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-emerald-400 text-sm mb-4 font-semibold"
        >
          Last answer: +{lastReward.xp} XP · +{lastReward.coins} Coins · DNA Match improved
        </motion.p>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard className="p-5 border-amber-400/20">
          <p className="text-[10px] uppercase tracking-wider text-purple-400/50 mb-2">DNA XP</p>
          <p className="text-2xl font-black text-amber-400">{profile.totalXpEarned.toLocaleString()}</p>
        </GlassCard>
        <GlassCard className="p-5 border-purple-400/20">
          <p className="text-[10px] uppercase tracking-wider text-purple-400/50 mb-2">Completion</p>
          <p className="text-2xl font-black text-violet-300">{profile.completionPercent}%</p>
        </GlassCard>
        <GlassCard className="p-5 border-emerald-400/20">
          <p className="text-[10px] uppercase tracking-wider text-purple-400/50 mb-2">Badges</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {profile.badges.map((badge) => (
              <span key={badge} className="rounded-md border border-emerald-400/25 bg-emerald-950/30 px-2 py-0.5 text-[10px] text-emerald-300">
                {badge}
              </span>
            ))}
          </div>
        </GlassCard>
        <GlassCard glow="gold" className="p-5 border-amber-400/25">
          <p className="text-[10px] uppercase tracking-wider text-purple-400/50 mb-2">Next Unlock</p>
          <p className="text-sm font-bold text-amber-200">
            {nextUnlock ? (
              <>
                {nextUnlock.icon} {nextUnlock.label} at {nextUnlock.threshold}%
              </>
            ) : (
              "All current unlocks achieved"
            )}
          </p>
          <p className="text-[11px] text-purple-400/50 mt-2">{profile.nextReward}</p>
        </GlassCard>
      </div>
    </section>
  );
}
