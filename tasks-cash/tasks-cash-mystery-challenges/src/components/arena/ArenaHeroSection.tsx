"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { GlassCard } from "@/components/GlassCard";
import { CHALLENGES_ARENA, formatCountdown } from "@/data/challenges-arena-data";
import { AnimatedProgressBar } from "@/components/progression/AnimatedProgressBar";

function CountdownDisplay({ endsAt }: { endsAt: Date }) {
  const [text, setText] = useState("--:--:--");

  useEffect(() => {
    const tick = () => setText(formatCountdown(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return (
    <motion.p
      className="reward-value font-mono tabular-nums tracking-wider animate-glow-pulse"
      animate={{ opacity: [0.85, 1, 0.85] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {text}
    </motion.p>
  );
}

export function ArenaHeroSection() {
  const { overview } = CHALLENGES_ARENA;
  const endsAt = new Date(CHALLENGES_ARENA.nextChallengeEndsAt);

  return (
    <section className="relative z-10 text-center pt-10 pb-14 md:pt-16 md:pb-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <motion.p className="game-eyebrow mb-5 animate-glow-pulse" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}>
          Premium Game Arena
        </motion.p>

        <div className="hero-title-wrap mx-auto max-w-5xl">
          <h1 className="hero-title">CHALLENGES ARENA</h1>
        </div>

        <p className="max-w-3xl mx-auto game-desc text-lg md:text-xl leading-relaxed px-4 mt-6">
          Compete in missions, win rewards, climb levels, and become one of the top explorers.
        </p>

        <div className="portal-divider mt-12 max-w-lg mx-auto opacity-60" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
        className="mt-12 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-5 text-left"
      >
        <StatCard label="Active Challenges" value={overview.activeChallenges} icon="⚔️" glow="violet" />
        <StatCard label="Current Reward Pool" value={overview.currentRewardPool} icon="💰" glow="gold" />
        <StatCard label="Active Players" value={overview.activePlayers.toLocaleString()} icon="👥" glow="purple" />
        <GlassCard glow="gold" className="game-card-padding col-span-2 lg:col-span-1 xl:col-span-1 border-amber-400/25 text-left animate-light-sweep">
          <span className="game-label block mb-3">Next Challenge</span>
          <CountdownDisplay endsAt={endsAt} />
        </GlassCard>
        <StatCard label="Today&apos;s Winners" value={overview.todaysWinners} icon="🏆" glow="gold" />
        <GlassCard glow="violet" className="game-card-padding text-left">
          <span className="game-label block mb-3">Season Progress</span>
          <p className="game-desc mb-3">{overview.seasonLabel}</p>
          <AnimatedProgressBar value={overview.seasonProgress} currentLabel={`${overview.seasonProgress}%`} size="sm" glow="violet" />
        </GlassCard>
      </motion.div>
    </section>
  );
}
