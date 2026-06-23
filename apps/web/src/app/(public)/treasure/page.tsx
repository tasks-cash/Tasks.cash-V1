"use client";

import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem, Badge } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, StatsBanner, FeatureGrid } from "@/components/pages/PublicSections";
import { TREASURES } from "@/lib/mock-data";

const RARITY_GLOW: Record<string, "gold" | "purple" | undefined> = {
  legendary: "gold",
  epic: "purple",
  rare: undefined,
};

export default function TreasurePage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Loot" title="Treasure Vault" subtitle="Legendary artifacts, rare gear, and portal keys await the worthy." variant="gold" />

      <StatsBanner stats={[
        { label: "Treasures Found", value: 128400, icon: "💎" },
        { label: "Legendary Drops", value: 3420, icon: "👑" },
        { label: "Chests Opened", value: 89000, icon: "📦", live: true },
        { label: "Unique Items", value: 156, icon: "✨" },
      ]} />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Collection" title="Legendary Artifacts" subtitle="Unlock treasures through missions, challenges, and chest rolls." />
        <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TREASURES.map((t) => (
            <MotionStaggerItem key={t.id}>
              <GlassCard glow={RARITY_GLOW[t.rarity]} className={`p-6 text-center h-full ${t.locked ? "opacity-60" : ""}`} hover={!t.locked}>
                <span className="text-5xl">{t.icon}</span>
                <h3 className="font-bold text-white mt-4">{t.name}</h3>
                <Badge variant={t.rarity === "legendary" ? "gold" : "default"} className="mt-2">{t.rarity}</Badge>
                {t.locked && <p className="text-xs text-purple-400/50 mt-3">🔒 Locked — Complete missions to unlock</p>}
              </GlassCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <SectionHeader eyebrow="Chest System" title="How Treasures Drop" />
        <FeatureGrid items={[
          { icon: "📦", title: "Mission Chests", desc: "Complete elite missions for guaranteed rare+ drops.", glow: "purple" },
          { icon: "🎰", title: "Daily Rolls", desc: "Log in daily for a free chest roll with escalating odds.", glow: "gold" },
          { icon: "🏆", title: "Challenge Prizes", desc: "Top challenge finishers win exclusive legendary artifacts.", glow: "gold" },
          { icon: "🔑", title: "Portal Keys", desc: "Rare keys unlock legendary vaults with guaranteed epics.", glow: "gold" },
        ]} columns={4} />
        <div className="text-center mt-10">
          <Link href="/register"><PortalButton variant="gold" size="lg">Start Collecting</PortalButton></Link>
        </div>
      </div>

      <EpicCTA title="Claim Your First Treasure" subtitle="New explorers receive a free rare chest on registration." primaryLabel="Open Free Chest" />
    </PublicPageWrapper>
  );
}
