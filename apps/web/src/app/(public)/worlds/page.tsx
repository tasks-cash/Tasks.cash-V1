"use client";

import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem, Badge } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, StatsBanner, FeatureGrid } from "@/components/pages/PublicSections";
import { WORLDS } from "@/lib/mock-data";

export default function WorldsPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Explore" title="Dimensional Worlds" subtitle="Explore realms, each with unique missions, treasures, and challenges." variant="gold" />

      <StatsBanner stats={[
        { label: "Active Worlds", value: 4, icon: "🌌" },
        { label: "Total Missions", value: 69, icon: "⚔️" },
        { label: "Explorers Active", value: 42300, icon: "👥", live: true },
        { label: "Legendary Drops", value: 1280, icon: "👑" },
      ]} />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Realms" title="Choose Your Dimension" subtitle="Each world offers unique difficulty, rewards, and lore." />
        <MotionStagger className="grid md:grid-cols-2 gap-6">
          {WORLDS.map((w) => (
            <MotionStaggerItem key={w.id}>
              <GlassCard glow={w.difficulty === "Legendary" ? "gold" : undefined} className="p-6 h-full" hover>
                <div className="flex items-start justify-between">
                  <span className="text-5xl">{w.icon}</span>
                  <Badge variant={w.difficulty === "Legendary" ? "gold" : "default"}>{w.difficulty}</Badge>
                </div>
                <h3 className="text-xl font-bold text-white mt-4">{w.name}</h3>
                <p className="text-purple-200/60 text-sm mt-2 leading-relaxed">{w.desc}</p>
                <div className="flex justify-between mt-6 pt-4 border-t border-purple-500/10 text-sm">
                  <span className="text-purple-400">{w.missions} missions</span>
                  <Link href="/missions"><PortalButton variant="ghost" size="sm">View Missions →</PortalButton></Link>
                </div>
              </GlassCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <SectionHeader eyebrow="Features" title="World Mechanics" />
        <FeatureGrid items={[
          { icon: "🗺️", title: "Dynamic Maps", desc: "Procedurally shifting landscapes keep exploration fresh.", glow: "purple" },
          { icon: "⚔️", title: "World Missions", desc: "Exclusive quests tied to each dimension's lore and difficulty.", glow: "gold" },
          { icon: "💎", title: "Rare Loot", desc: "Legendary treasures drop only in specific worlds.", glow: "gold" },
        ]} />
      </div>

      <EpicCTA title="Enter Your First World" subtitle="Register and unlock all four dimensions instantly." primaryLabel="Begin Exploration" />
    </PublicPageWrapper>
  );
}
