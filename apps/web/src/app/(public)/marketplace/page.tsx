"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem, Badge, CoinBadge } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, StatsBanner } from "@/components/pages/PublicSections";
import { MARKETPLACE_CATEGORIES, MARKETPLACE_ITEMS } from "@/lib/page-data";

export default function MarketplacePage() {
  const [category, setCategory] = useState<string>("all");
  const filtered = category === "all" ? MARKETPLACE_ITEMS : MARKETPLACE_ITEMS.filter((i) => i.type === category);

  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Trade" title="Portal Marketplace" subtitle="Spend portal coins on boosts, cosmetics, utilities, and legendary bundles." variant="gold" />

      <StatsBanner stats={[
        { label: "Items Listed", value: 50, icon: "🛒" },
        { label: "Daily Purchases", value: 8420, icon: "💎", live: true },
        { label: "Featured Deals", value: 8, icon: "⭐" },
        { label: "Total Volume", value: 2400000, suffix: " ◈", icon: "◈" },
      ]} />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Categories" title="Browse the Vault" />
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          <button type="button" onClick={() => setCategory("all")} className={`rounded-xl px-4 py-2 text-sm transition-all ${category === "all" ? "bg-purple-600/40 text-white border border-purple-400/40" : "border border-purple-500/20 text-purple-300/70 hover:border-purple-400/40"}`}>All Items</button>
          {MARKETPLACE_CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`rounded-xl px-4 py-2 text-sm transition-all flex items-center gap-2 ${category === c.id ? "bg-purple-600/40 text-white border border-purple-400/40" : "border border-purple-500/20 text-purple-300/70 hover:border-purple-400/40"}`}>
              <span>{c.icon}</span>{c.name}
            </button>
          ))}
        </div>

        <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <MotionStaggerItem key={item.id}>
              <GlassCard glow={item.featured ? "gold" : undefined} className="p-6 h-full flex flex-col" hover>
                {item.featured && <Badge variant="gold" className="mb-3 w-fit">Featured</Badge>}
                <span className="text-4xl">{item.icon}</span>
                <h3 className="font-bold text-white mt-3">{item.name}</h3>
                <p className="text-purple-200/50 text-sm mt-2 flex-1">{item.desc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <CoinBadge amount={item.price} size="sm" />
                  <PortalButton variant="gold" size="sm">Buy</PortalButton>
                </div>
              </GlassCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <GlassCard glow="gold" className="p-8 text-center">
          <h3 className="text-xl font-bold text-amber-300 mb-2">Need More Coins?</h3>
          <p className="text-purple-200/60 mb-6">Complete missions and challenges to earn portal coins for the marketplace.</p>
          <Link href="/missions"><PortalButton variant="secondary">View Missions</PortalButton></Link>
        </GlassCard>
      </div>

      <EpicCTA title="Unlock Premium Items" subtitle="Register now and receive 250 bonus coins for your first marketplace purchase." primaryLabel="Get Bonus Coins" />
    </PublicPageWrapper>
  );
}
