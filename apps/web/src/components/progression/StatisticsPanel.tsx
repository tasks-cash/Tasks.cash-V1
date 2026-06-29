"use client";

import { motion } from "framer-motion";
import type { PlayerStatistics } from "@/types/player-progression";
import { GlassCard } from "@tasks-cash/ui";
import { ProgressionSection } from "./ProgressionSection";

const STAT_ICONS: Record<string, string> = {
  daysActive: "📅",
  totalXpEarned: "⚡",
  missionsCompleted: "📜",
  raidsJoined: "⚔️",
  videosApproved: "🎬",
  referralsActive: "🔗",
  secretsFound: "🔮",
  totalWealth: "💰",
  seasonRank: "🏆",
  globalRank: "🌍",
};

const STAT_LABELS: Record<keyof PlayerStatistics, string> = {
  daysActive: "Days Active",
  totalXpEarned: "Total XP Earned",
  missionsCompleted: "Missions Completed",
  raidsJoined: "Raids Joined",
  videosApproved: "Videos Approved",
  referralsActive: "Active Referrals",
  secretsFound: "Secrets Found",
  totalWealth: "Total Wealth",
  seasonRank: "Season Rank",
  globalRank: "Global Rank",
};

export function StatisticsPanel({ stats }: { stats: PlayerStatistics }) {
  const entries = Object.entries(stats) as [keyof PlayerStatistics, string | number][];

  return (
    <ProgressionSection
      id="statistics"
      eyebrow="◈ Lifetime Record ◈"
      title="Statistics"
      subtitle="Every action across the portal — your permanent explorer ledger."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {entries.map(([key, value], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04 }}
          >
            <GlassCard glow={i % 3 === 0 ? "gold" : "purple"} className="prog-stat-card p-5 text-center h-full">
              <span className="text-2xl block mb-2">{STAT_ICONS[key]}</span>
              <p className="text-[9px] uppercase tracking-wider text-purple-400/50 mb-1">{STAT_LABELS[key]}</p>
              <p className="text-lg md:text-xl font-black text-white tabular-nums">
                {typeof value === "number" ? (key.includes("Rank") ? `#${value}` : value.toLocaleString()) : value}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </ProgressionSection>
  );
}
