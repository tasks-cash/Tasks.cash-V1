"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function storePage() {
  return (
    <div>
      <PageHero eyebrow="Marketplace" title="Portal Store" subtitle="Spend coins on boosts, cosmetics, and utilities." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">{STORE_ITEMS.map((item) => (<MotionStaggerItem key={item.id}><GlassCard className="p-6"><span className="text-3xl">{item.icon}</span><h3 className="font-bold text-white mt-3">{item.name}</h3><p className="text-amber-400 font-bold mt-2">{item.price} ◈</p><PortalButton variant="gold" size="sm" className="mt-4 w-full">Purchase</PortalButton></GlassCard></MotionStaggerItem>))}</MotionStagger>
      </div>
    </div>
  );
}
