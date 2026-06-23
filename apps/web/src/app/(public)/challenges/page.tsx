"use client";

import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, StatsBanner, FeatureGrid } from "@/components/pages/PublicSections";
import { PUBLIC_CHALLENGES } from "@/lib/mock-data";

export default function ChallengesPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Compete" title="Live Challenges" subtitle="Timed events with massive XP and coin rewards. Compete against warriors worldwide." variant="gold" />

      <StatsBanner stats={[
        { label: "Active Events", value: 3, icon: "🎯" },
        { label: "Participants", value: 23570, icon: "👥", live: true },
        { label: "Prize Pool", value: 500000, suffix: " ◈", icon: "💰" },
        { label: "Weekly Winners", value: 150, icon: "🏆" },
      ]} />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Live Now" title="Active Challenges" subtitle="Join before time runs out — rewards scale with participation." />
        <MotionStagger className="grid md:grid-cols-3 gap-6">
          {PUBLIC_CHALLENGES.map((c) => (
            <MotionStaggerItem key={c.id}>
              <GlassCard glow="gold" className="p-6 h-full flex flex-col" hover>
                <h3 className="text-lg font-bold text-white">{c.title}</h3>
                <p className="text-amber-300/80 text-sm mt-2 flex-1">{c.reward}</p>
                <div className="mt-4 pt-4 border-t border-purple-500/10">
                  <p className="text-purple-400/60 text-xs">Ends in {c.endsIn}</p>
                  <p className="text-purple-300 text-sm mt-1">{c.participants.toLocaleString()} warriors</p>
                </div>
                <Link href="/register" className="block mt-4">
                  <PortalButton variant="gold" size="sm" className="w-full">Join Challenge</PortalButton>
                </Link>
              </GlassCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <SectionHeader eyebrow="Rules" title="Challenge Mechanics" />
        <FeatureGrid items={[
          { icon: "⏱️", title: "Time-Limited", desc: "Events run on fixed schedules — plan your strategy.", glow: "purple" },
          { icon: "📈", title: "Scaling Rewards", desc: "More participants = bigger prize pools for top performers.", glow: "gold" },
          { icon: "🏅", title: "Exclusive Badges", desc: "Winners earn unique badges displayed on leaderboards.", glow: "gold" },
        ]} />
      </div>

      <EpicCTA title="Compete for Glory" subtitle="Register and join this week's Coin Rush Weekend." primaryLabel="Join the Arena" />
    </PublicPageWrapper>
  );
}
