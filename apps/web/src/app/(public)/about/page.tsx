"use client";

import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem, Avatar, AvatarFallback } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, FeatureGrid, SectionHeader, Timeline, PageStatsRow } from "@/components/pages/PublicSections";
import { ABOUT_TEAM, ABOUT_MILESTONES } from "@/lib/page-data";

export default function AboutPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Our Story" title="About the Portal" subtitle="Where real tasks become epic quests across the multiverse." variant="gold" />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-purple-200/60 leading-relaxed">Tasks.cash transforms everyday productivity into an epic journey. We blend dark fantasy aesthetics with sci-fi portal mechanics to make completing real tasks feel like conquering dimensions.</p>
          </GlassCard>
          <GlassCard glow="gold" className="p-8">
            <h2 className="text-xl font-bold text-amber-300 mb-4">The Vision</h2>
            <p className="text-purple-200/60 leading-relaxed">Build the most immersive gamified task platform — where discipline meets adventure, and every completed mission brings you closer to legendary status.</p>
          </GlassCard>
        </div>

        <PageStatsRow stats={[
          { label: "Explorers", value: "847K+", icon: "👥", glow: "gold" },
          { label: "Missions Completed", value: "12.4M", icon: "⚔️" },
          { label: "Worlds", value: "4", icon: "🌌" },
          { label: "Team Members", value: "24", icon: "🛡️" },
        ]} />

        <SectionHeader eyebrow="Timeline" title="Portal History" subtitle="From concept to multiverse conquest." />
        <Timeline items={ABOUT_MILESTONES} />

        <div className="mt-20">
          <SectionHeader eyebrow="Team" title="The Void Council" subtitle="Architects of the portal universe." />
          <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ABOUT_TEAM.map((member) => (
              <MotionStaggerItem key={member.name}>
                <GlassCard className="p-6 text-center" hover>
                  <Avatar className="mx-auto h-16 w-16 border-2 border-purple-500/30">
                    <AvatarFallback className="bg-purple-900 text-amber-400 font-bold">{member.avatar}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-white mt-4">{member.name}</h3>
                  <p className="text-amber-400/80 text-sm">{member.role}</p>
                  <p className="text-purple-200/50 text-xs mt-2">{member.bio}</p>
                </GlassCard>
              </MotionStaggerItem>
            ))}
          </MotionStagger>
        </div>

        <div className="mt-20">
          <SectionHeader eyebrow="Values" title="What Drives Us" />
          <FeatureGrid items={[
            { icon: "🎮", title: "AAA Quality", desc: "Game-launcher polish in every pixel and interaction.", glow: "gold" },
            { icon: "⚡", title: "Performance", desc: "Lightning-fast, mobile-first, built for scale.", glow: "purple" },
            { icon: "🤝", title: "Community", desc: "Explorers first — your feedback shapes the portal.", glow: "purple" },
            { icon: "🔒", title: "Trust", desc: "Transparent rewards, secure wallets, fair play.", glow: "gold" },
          ]} columns={4} />
        </div>
      </div>

      <EpicCTA title="Join the Void Council's Creation" subtitle="Become an explorer and help us build the ultimate gamified universe." primaryLabel="Enter the Portal" />
    </PublicPageWrapper>
  );
}
