"use client";

import { motion } from "framer-motion";
import { AnimatedCounter } from "../shared/AnimatedCounter";
import { HOMEPAGE_STATS } from "../data/homepage-data";

const STATS = [
  { label: "Players Online", value: HOMEPAGE_STATS.onlineUsers, icon: "🟢", live: true, liveVariance: 12, glow: "violet" },
  { label: "Missions Completed", value: 2847291, icon: "⚔️", glow: "purple" },
  { label: "Rewards Distributed", value: HOMEPAGE_STATS.rewardsDistributed, icon: "◈", prefix: "◈ ", glow: "gold" },
  { label: "Active Challenges", value: HOMEPAGE_STATS.activeMissions, icon: "🎯", live: true, liveVariance: 3, glow: "purple" },
  { label: "Community Members", value: HOMEPAGE_STATS.registeredUsers, icon: "👥", glow: "gold" },
];

export function StatsBar() {
  return (
    <section className="relative w-full py-8 md:py-12 border-y border-purple-500/15 bg-black/40 backdrop-blur-sm">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className={`hp-stat-card group relative rounded-2xl border p-4 md:p-6 overflow-hidden ${
                stat.glow === "gold"
                  ? "border-amber-400/25 bg-gradient-to-br from-amber-950/30 to-black/80"
                  : stat.glow === "violet"
                    ? "border-violet-400/25 bg-gradient-to-br from-violet-950/40 to-black/80"
                    : "border-purple-500/20 bg-gradient-to-br from-purple-950/40 to-black/80"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between mb-2">
                <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-purple-300/60 font-[family-name:var(--font-orbitron)] font-bold">
                  {stat.label}
                </span>
                <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{stat.icon}</span>
              </div>
              <p className={`relative z-10 text-2xl sm:text-3xl md:text-4xl font-black tabular-nums font-[family-name:var(--font-rajdhani)] ${
                stat.glow === "gold" ? "text-amber-400" : "text-white"
              }`}>
                <AnimatedCounter
                  target={stat.value}
                  prefix={stat.prefix ?? ""}
                  live={stat.live}
                  liveVariance={stat.liveVariance}
                />
              </p>
              {stat.live && (
                <p className="relative z-10 mt-2 flex items-center gap-1.5 text-[9px] text-emerald-400 font-[family-name:var(--font-orbitron)] uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
