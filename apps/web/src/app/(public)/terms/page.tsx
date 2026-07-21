"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function termsPage() {
  return (
    <div>
      <PageHero eyebrow="Legal" title="Terms of Service" subtitle="Rules governing your journey through the portal." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <GlassCard className="p-8 max-w-3xl mx-auto prose prose-invert"><h2 className="text-white">1. Acceptance</h2><p className="text-purple-200/60">By entering the portal, you agree to these terms.</p><h2 className="text-white mt-6">2. Account</h2><p className="text-purple-200/60">You are responsible for maintaining account security.</p><h2 className="text-white mt-6">3. Rewards</h2><p className="text-purple-200/60">Virtual coins and rewards are subject to platform rules and withdrawal policies.</p></GlassCard>
      </div>
    </div>
  );
}
