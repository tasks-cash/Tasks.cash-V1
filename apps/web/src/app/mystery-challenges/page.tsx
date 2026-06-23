"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BrandLogo,
  ParticleField,
  StatCard,
  GlassCard,
  GameButton,
  MysteryMissionCard,
  TopExplorersPanel,
} from "@tasks-cash/ui";
import { getToken } from "@/lib/api";
import {
  MYSTERY_CHALLENGE_STATS,
  FEATURED_CHALLENGE,
  MYSTERY_CHALLENGE_MISSIONS,
  REWARD_POOL,
  TOP_10_EXPLORERS,
  NEXT_CHALLENGE_UNLOCK,
  formatCountdown,
} from "@/lib/mystery-challenges-data";

function CountdownBlock({ endsAt }: { endsAt: Date }) {
  const [text, setText] = useState("--:--:--");

  useEffect(() => {
    const update = () => setText(formatCountdown(endsAt));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return (
    <motion.p
      className="text-4xl md:text-5xl font-black font-mono text-amber-400 tabular-nums tracking-wider"
      animate={{ opacity: [0.75, 1, 0.75] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {text}
    </motion.p>
  );
}

export default function MysteryChallengesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  return (
    <div className="relative min-h-screen flex flex-col z-10">
      <ParticleField count={90} className="fixed inset-0 z-[2] opacity-35" />

      <motion.div
        className="fixed left-1/2 top-[18%] h-[800px] w-[800px] -translate-x-1/2 rounded-full pointer-events-none z-[2]"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 65%)" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="portal-ring fixed left-1/2 top-[22%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12] pointer-events-none z-[2]"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
      />

      <motion.div
        className="fixed inset-0 mystery-fog pointer-events-none z-[2] opacity-45"
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Minimal header — back only */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-8 py-4 border-b border-purple-900/40 bg-black/60 backdrop-blur-xl">
        <BrandLogo size="xs" href={undefined} animated={false} />
        <Link href="/dashboard">
          <GameButton variant="ghost" size="sm" data-sound="back-dashboard">
            ← Back to Dashboard
          </GameButton>
        </Link>
      </header>

      {/* 1. Hero */}
      <section className="relative z-10 px-4 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            className="text-2xl md:text-3xl font-black text-violet-200/90 mb-4 font-[family-name:var(--font-cinzel)]"
            dir="rtl"
            animate={{ opacity: [0.65, 1, 0.65] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            الوضع الغامض والتحديات
          </motion.p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-[0.08em] text-transparent bg-clip-text bg-gradient-to-b from-violet-100 via-purple-400 to-amber-400/80 font-[family-name:var(--font-cinzel)] mb-5 drop-shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            MYSTERY MODE & CHALLENGES
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-purple-300/55 leading-relaxed">
            Secret missions. Hidden rewards. Global challenges.
          </p>

          <div className="portal-divider mt-12 max-w-md mx-auto opacity-60" />
        </motion.div>
      </section>

      <main className="relative z-10 flex-1 px-4 pb-24 md:px-8 max-w-6xl mx-auto w-full space-y-16 md:space-y-20">
        {/* 2. Live challenge stats */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-sm uppercase tracking-[0.35em] text-purple-400/60 mb-6 text-center font-semibold">
            Live Challenge Stats
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Active Challenges" value={MYSTERY_CHALLENGE_STATS.activeChallenges} icon="⚔️" glow="violet" />
            <StatCard label="Total Rewards Available" value={MYSTERY_CHALLENGE_STATS.totalRewardsAvailable} icon="🎁" glow="gold" />
            <StatCard label="Completed Missions" value={MYSTERY_CHALLENGE_STATS.completedMissions} icon="✓" glow="purple" />
            <StatCard label="Withdrawals Completed" value={MYSTERY_CHALLENGE_STATS.withdrawalsCompleted} icon="◈" glow="gold" />
          </div>
        </motion.section>

        {/* 3. Featured challenge */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-black text-white mb-6 font-[family-name:var(--font-cinzel)] flex items-center gap-2">
            <span className="text-amber-400">◈</span> Featured Challenge
          </h2>
          <GlassCard glow="gold" className="p-8 md:p-10 border-amber-400/30">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <span className="game-badge-gold mb-4">Active · Commission Eligible</span>
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4 font-[family-name:var(--font-cinzel)]">
                  {FEATURED_CHALLENGE.title}
                </h3>
                <div className="space-y-4 text-sm md:text-base">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-purple-400/50 mb-1">Requirement</p>
                    <p className="text-violet-200/85">{FEATURED_CHALLENGE.requirement}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-purple-400/50 mb-1">Reward</p>
                    <p className="text-amber-400 font-bold">{FEATURED_CHALLENGE.reward}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 shrink-0 lg:min-w-[200px]">
                <div className="rounded-xl border border-amber-400/25 bg-black/50 p-4 text-center">
                  <p className="text-[10px] text-purple-400/50 uppercase">XP</p>
                  <p className="text-2xl font-black text-amber-400">+{FEATURED_CHALLENGE.xp}</p>
                </div>
                <div className="rounded-xl border border-amber-400/25 bg-black/50 p-4 text-center">
                  <p className="text-[10px] text-purple-400/50 uppercase">Coins</p>
                  <p className="text-2xl font-black text-amber-400">◈ {FEATURED_CHALLENGE.coins}</p>
                </div>
                <GameButton
                  variant="gold"
                  pulse
                  className="w-full"
                  data-sound="featured-challenge"
                  onClick={() => router.push("/dashboard/missions/submit")}
                >
                  Accept Trial
                </GameButton>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* 4. Mystery missions */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-black text-white mb-6 font-[family-name:var(--font-cinzel)]">
            Mystery Missions
          </h2>
          <div className="grid gap-6">
            {MYSTERY_CHALLENGE_MISSIONS.map((mission, i) => (
              <motion.div
                key={mission._id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ delay: i * 0.08, duration: 0.65 }}
              >
                <MysteryMissionCard
                  mission={mission}
                  revealDetails
                  actionLabel={mission.playerState === "unlocked" ? "Begin Mission" : undefined}
                  onStart={() => router.push("/dashboard/missions/submit")}
                />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 5. Top 10 + 6. Reward pool */}
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <TopExplorersPanel entries={TOP_10_EXPLORERS} className="border-amber-400/20 shadow-glow-gold h-full" />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl font-black text-white mb-6 font-[family-name:var(--font-cinzel)] flex items-center gap-2">
              <span>💰</span> Reward Pool
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {REWARD_POOL.map((pool, i) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -4 }}
                >
                  <GlassCard glow={pool.glow} className="p-5 text-center border-amber-400/20">
                    <span className="text-3xl mb-2 block">{pool.icon}</span>
                    <p className="text-[10px] uppercase tracking-widest text-purple-400/50 mb-1">{pool.name}</p>
                    <p className="text-xl font-black text-amber-400">{pool.amount}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* 7. Countdown */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center pb-8"
        >
          <GlassCard glow="violet" className="p-10 md:p-14 border-violet-400/30">
            <p className="text-sm uppercase tracking-[0.4em] text-purple-400/60 mb-4">Next Challenge Unlocks In</p>
            <CountdownBlock endsAt={NEXT_CHALLENGE_UNLOCK} />
            <p className="mt-6 text-purple-300/50 text-sm max-w-md mx-auto">
              A new global challenge enters the fog when the portal timer reaches zero. Be ready.
            </p>
          </GlassCard>
        </motion.section>
      </main>
    </div>
  );
}
