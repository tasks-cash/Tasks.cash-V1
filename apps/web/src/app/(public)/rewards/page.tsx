"use client";

import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem, Badge } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, FeatureGrid, SectionHeader, StatsBanner } from "@/components/pages/PublicSections";
import { PUBLIC_REWARDS } from "@/lib/page-data";

const TIER_COLORS: Record<string, string> = {
  common: "border-purple-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-400/40",
  gold: "border-amber-400/40",
  legendary: "border-amber-400/60",
};

export default function RewardsPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Earn" title="Portal Rewards" subtitle="Daily bonuses, mission payouts, referrals, and legendary prizes await." variant="gold" />

      <StatsBanner stats={[
        { label: "Rewards Distributed", value: 847000, suffix: "+", icon: "🎁" },
        { label: "Daily Claimers", value: 42300, icon: "☀️", live: true },
        { label: "Referral Bonuses", value: 1280000, suffix: " coins", icon: "🔗" },
        { label: "Legendary Drops", value: 3420, icon: "👑" },
      ]} />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Reward Types" title="Every Path Pays" subtitle="Multiple reward streams keep your portal journey profitable." />
        <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUBLIC_REWARDS.map((r) => (
            <MotionStaggerItem key={r.id}>
              <GlassCard glow={r.tier === "legendary" || r.tier === "gold" ? "gold" : undefined} className={`p-6 h-full border ${TIER_COLORS[r.tier] ?? ""}`} hover>
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{r.icon}</span>
                  <Badge variant={r.tier === "legendary" ? "gold" : "default"}>{r.tier}</Badge>
                </div>
                <h3 className="text-lg font-bold text-white mt-4">{r.name}</h3>
                <p className="text-amber-400 font-semibold mt-2">{r.amount}</p>
                <p className="text-purple-400/50 text-xs uppercase mt-3 tracking-wider">{r.type}</p>
              </GlassCard>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <SectionHeader eyebrow="Daily Rewards" title="Claim Every Day" subtitle="Log in daily to build streaks and unlock escalating bonuses." />
        <FeatureGrid items={[
          { icon: "☀️", title: "Day 1–3", desc: "50 coins per login. Build your streak foundation.", glow: "purple" },
          { icon: "🔥", title: "Day 4–7", desc: "100 coins + bonus XP. Streak multiplier activates.", glow: "gold" },
          { icon: "⚡", title: "Day 8–14", desc: "200 coins + rare badge chance. Elite streak tier.", glow: "gold" },
          { icon: "👑", title: "Day 15+", desc: "500 coins + legendary chest roll. Maximum rewards.", glow: "gold" },
        ]} columns={4} />
        <div className="text-center mt-10">
          <Link href="/register"><PortalButton variant="gold" size="lg">Start Earning Today</PortalButton></Link>
        </div>
      </div>

      <EpicCTA title="Your Rewards Await" subtitle="Create an account and claim your welcome bonus — 500 portal coins." primaryLabel="Claim Welcome Bonus" />
    </PublicPageWrapper>
  );
}
