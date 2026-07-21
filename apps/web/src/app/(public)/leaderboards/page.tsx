"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function leaderboardsPage() {
  return (
    <div>
      <PageHero eyebrow="Rankings" title="Global Leaderboards" subtitle="The greatest portal warriors ranked by XP." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <GlassCard className="p-6">{LEADERBOARD_MOCK.map((e) => (<LeaderboardRow key={e.rank} entry={{ ...e, userId: String(e.rank), completedMissions: 10 + e.rank }} highlight={e.rank <= 3} />))}</GlassCard>
      </div>
    </div>
  );
}
