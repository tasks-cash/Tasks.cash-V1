"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function aboutPage() {
  return (
    <div>
      <PageHero eyebrow="Our Story" title="About the Portal" subtitle="Where real tasks become epic quests across the multiverse." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-8">
          <GlassCard className="p-8"><h2 className="text-xl font-bold text-white mb-4">Our Mission</h2><p className="text-purple-200/60 leading-relaxed">Tasks.cash transforms everyday productivity into an epic journey. We blend dark fantasy aesthetics with sci-fi portal mechanics to make completing real tasks feel like conquering dimensions.</p></GlassCard>
          <GlassCard glow="gold" className="p-8"><h2 className="text-xl font-bold text-amber-300 mb-4">The Vision</h2><p className="text-purple-200/60 leading-relaxed">Build the most immersive gamified task platform — where discipline meets adventure, and every completed mission brings you closer to legendary status.</p></GlassCard>
        </div>
      </div>
    </div>
  );
}
