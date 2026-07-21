"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function worldsPage() {
  return (
    <div>
      <PageHero eyebrow="Explore" title="Dimensional Worlds" subtitle="Explore realms, each with unique missions and treasures." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <MotionStagger className="grid md:grid-cols-2 gap-6">{WORLDS.map((w) => (<MotionStaggerItem key={w.id}><GlassCard className="p-6 h-full"><span className="text-4xl">{w.icon}</span><h3 className="text-xl font-bold text-white mt-4">{w.name}</h3><p className="text-purple-200/60 text-sm mt-2">{w.desc}</p><div className="flex justify-between mt-4 text-xs text-purple-400"><span>{w.difficulty}</span><span>{w.missions} missions</span></div></GlassCard></MotionStaggerItem>))}</MotionStagger>
      </div>
    </div>
  );
}
