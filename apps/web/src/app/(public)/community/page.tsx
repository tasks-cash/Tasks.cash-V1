"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function communityPage() {
  return (
    <div>
      <PageHero eyebrow="Allies" title="Portal Community" subtitle="Connect with warriors, guilds, and dimensional allies." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-6">{["Discord Guilds", "Portal Forums", "Live Events"].map((name) => (<GlassCard key={name} className="p-6 text-center"><span className="text-4xl">👥</span><h3 className="text-lg font-bold text-white mt-4">{name}</h3><p className="text-purple-200/60 text-sm mt-2">Connect with thousands of portal warriors.</p><PortalButton variant="secondary" size="sm" className="mt-4">Coming Soon</PortalButton></GlassCard>))}</div>
      </div>
    </div>
  );
}
