"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function faqPage() {
  return (
    <div>
      <PageHero eyebrow="Help" title="FAQ" subtitle="Answers to common portal questions." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div className="space-y-4 max-w-3xl mx-auto">{FAQ_ITEMS.map((item, i) => (<GlassCard key={i} className="p-6"><h3 className="font-bold text-white mb-2">{item.q}</h3><p className="text-purple-200/60 text-sm">{item.a}</p></GlassCard>))}</div>
      </div>
    </div>
  );
}
