"use client";

import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, StatsBanner, FeatureGrid } from "@/components/pages/PublicSections";
import { COMMUNITY_STATS } from "@/lib/page-data";

export default function CommunityPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Connect" title="Portal Community" subtitle="Join guilds, events, and conversations across the multiverse." variant="gold" />

      <StatsBanner stats={COMMUNITY_STATS.map((s) => ({
        label: s.label,
        value: parseInt(s.value.replace(/[^0-9]/g, "")) || 0,
        suffix: s.value.includes("+") ? "+" : s.value.includes("K") ? "K" : "",
        icon: s.icon,
        live: s.label === "Discord Online",
      }))} />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Hubs" title="Community Spaces" subtitle="Connect with fellow explorers across platforms." />
        <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: "Discord", icon: "💬", members: "45K+", desc: "Live chat, events, and support" },
            { name: "Reddit", icon: "🔴", members: "12K+", desc: "Guides, memes, and discussions" },
            { name: "Twitter/X", icon: "🐦", members: "28K+", desc: "Updates and announcements" },
            { name: "YouTube", icon: "▶️", members: "8K+", desc: "Tutorials and showcases" },
          ].map((hub) => (
            <MotionStaggerItem key={hub.name}>
              <GlassCard className="p-6 text-center h-full" hover>
                <span className="text-4xl">{hub.icon}</span>
                <h3 className="font-bold text-white mt-3">{hub.name}</h3>
                <p className="text-amber-400 text-sm">{hub.members}</p>
                <p className="text-purple-200/50 text-xs mt-2">{hub.desc}</p>
                <PortalButton variant="ghost" size="sm" className="mt-4">Join</PortalButton>
              </GlassCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <SectionHeader eyebrow="Events" title="Upcoming Gatherings" />
        <FeatureGrid items={[
          { icon: "🏟️", title: "Portal Tournament", desc: "Monthly PvP challenge with 10,000 coin prize pool.", glow: "gold" },
          { icon: "🎤", title: "Dev AMA", desc: "Live Q&A with the Void Council — every Friday.", glow: "purple" },
          { icon: "🎉", title: "Season Launch Party", desc: "Celebrate Season 4 with double XP weekend.", glow: "gold" },
        ]} />
      </div>

      <EpicCTA title="Join the Multiverse" subtitle="Connect with 847K+ explorers and grow together." primaryLabel="Enter the Portal" />
    </PublicPageWrapper>
  );
}
