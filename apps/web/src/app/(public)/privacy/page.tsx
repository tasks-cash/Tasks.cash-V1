"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function privacyPage() {
  return (
    <div>
      <PageHero eyebrow="Legal" title="Privacy Policy" subtitle="How we protect your data across dimensions." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <GlassCard className="p-8 max-w-3xl mx-auto"><h2 className="text-white font-bold mb-4">Data Collection</h2><p className="text-purple-200/60 mb-6">We collect account information, mission activity, and usage analytics to improve the platform.</p><h2 className="text-white font-bold mb-4">Your Rights</h2><p className="text-purple-200/60">You may request data export or deletion through support tickets.</p></GlassCard>
      </div>
    </div>
  );
}
