"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BrandLogo,
  GlowText,
  StatCard,
  MotionStagger,
  MotionStaggerItem,
  PortalButton,
  ParticleField,
} from "@tasks-cash/ui";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { MissionBoardCard } from "@/components/missions/MissionBoardCard";
import { MISSION_BOARD_ITEMS, MISSION_BOARD_STATS } from "@/lib/missions-board-data";

/** Public missions board — clean Mystery Mode layout */
export default function MissionsPage() {
  const availableCount = MISSION_BOARD_ITEMS.filter((m) => m.status === "available").length;
  const lockedCount = MISSION_BOARD_ITEMS.filter((m) => m.status === "locked").length;

  return (
    <PublicPageWrapper particles={false}>
      {/* Mystery Mode header */}
      <section className="relative px-4 pt-16 pb-10 md:pt-24 md:pb-14 overflow-hidden">
        <ParticleField count={40} className="opacity-50" />
        <div className="mystery-vault-fog absolute inset-0 pointer-events-none" />
        <div className="portal-ring absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-10 animate-portal-spin" />

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <BrandLogo size="md" href="/" className="mx-auto mb-6" animated={false} />
          <motion.p
            className="text-[10px] uppercase tracking-[0.45em] text-purple-400/60 mb-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ◈ Mystery Mode · Mission Board ◈
          </motion.p>
          <GlowText
            as="h1"
            variant="gold"
            className="text-3xl md:text-5xl lg:text-6xl mb-4 font-[family-name:var(--font-cinzel)]"
          >
            Missions
          </GlowText>
          <p className="mx-auto max-w-2xl text-purple-200/55 text-base md:text-lg leading-relaxed mb-8">
            Track active portal operations, sealed missions, and classified rewards.
            Most entries remain locked until you meet their unlock requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <PortalButton variant="gold" size="md" pulse data-sound="start-mission">
                Start First Mission
              </PortalButton>
            </Link>
            <Link href="/mystery-missions">
              <PortalButton variant="secondary" size="md">
                Explore Mystery Archive
              </PortalButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 -mt-4 mb-12 md:mb-16">
        <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MotionStaggerItem>
            <StatCard
              label="Total Completed"
              value={MISSION_BOARD_STATS.totalCompleted.toLocaleString()}
              icon="✅"
              glow="gold"
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <StatCard
              label="Pending Submissions"
              value={MISSION_BOARD_STATS.pendingSubmissions.toLocaleString()}
              icon="📜"
              glow="violet"
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <StatCard
              label="Rewards Earned"
              value={MISSION_BOARD_STATS.rewardsEarned}
              icon="💰"
              glow="gold"
            />
          </MotionStaggerItem>
          <MotionStaggerItem>
            <StatCard
              label="Withdrawals Done"
              value={MISSION_BOARD_STATS.withdrawalsCompleted.toLocaleString()}
              icon="◈"
              glow="purple"
            />
          </MotionStaggerItem>
        </MotionStagger>
      </section>

      {/* Mission board */}
      <section className="relative mx-auto max-w-3xl px-4 pb-24">
        <div className="portal-divider mb-10" />

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white font-[family-name:var(--font-cinzel)]">
              Active Mission Board
            </h2>
            <p className="text-purple-400/50 text-sm mt-1">
              {availableCount} available · {lockedCount} sealed · Mystery Mode
            </p>
          </div>
          <Link href="/login">
            <PortalButton variant="ghost" size="sm">
              Login to Submit
            </PortalButton>
          </Link>
        </div>

        <div className="space-y-4 md:space-y-5">
          {MISSION_BOARD_ITEMS.map((mission, index) => (
            <MissionBoardCard key={mission.id} mission={mission} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 rounded-2xl border border-purple-500/20 bg-black/40 p-6 text-center backdrop-blur-xl"
        >
          <p className="text-purple-300/60 text-sm mb-4">
            Want the full classified archive with category filters and discovery rituals?
          </p>
          <Link href="/mystery-missions">
            <PortalButton variant="gold" size="md" pulse>
              Enter Mystery Archive
            </PortalButton>
          </Link>
        </motion.div>
      </section>
    </PublicPageWrapper>
  );
}
