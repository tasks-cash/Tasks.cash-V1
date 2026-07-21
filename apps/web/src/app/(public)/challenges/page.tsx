"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function challengesPage() {
  return (
    <div>
      <PageHero eyebrow="Compete" title="Live Challenges" subtitle="Timed events with massive XP and coin rewards." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <MotionStagger className="grid md:grid-cols-3 gap-6">{PUBLIC_CHALLENGES.map((c) => (<MotionStaggerItem key={c.id}><GlassCard glow="gold" className="p-6"><h3 className="text-lg font-bold text-white">{c.title}</h3><p className="text-amber-300/80 text-sm mt-2">{c.reward}</p><p className="text-purple-400/60 text-xs mt-4">Ends in {c.endsIn} · {c.participants.toLocaleString()} warriors</p><Link href="/register" className="block mt-4"><PortalButton variant="gold" size="sm" className="w-full">Join Challenge</PortalButton></Link></GlassCard></MotionStaggerItem>))}</MotionStagger>
      </div>
    </div>
  );
}
