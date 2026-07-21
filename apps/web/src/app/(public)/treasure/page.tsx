"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function treasurePage() {
  return (
    <div>
      <PageHero eyebrow="Artifacts" title="Treasure Vault" subtitle="Legendary artifacts unlocked through dedication." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <MotionStagger className="grid grid-cols-2 md:grid-cols-4 gap-6">{TREASURES.map((t) => (<MotionStaggerItem key={t.id}><GlassCard className={`p-6 text-center ${t.locked ? "opacity-50" : ""}`} glow={t.rarity === "legendary" ? "gold" : "purple"}><span className="text-5xl block mb-3">{t.icon}</span><h3 className="font-bold text-white">{t.name}</h3><p className="text-xs uppercase tracking-wider text-purple-400 mt-2">{t.rarity}{t.locked ? " · Locked" : ""}</p></GlassCard></MotionStaggerItem>))}</MotionStagger>
      </div>
    </div>
  );
}
