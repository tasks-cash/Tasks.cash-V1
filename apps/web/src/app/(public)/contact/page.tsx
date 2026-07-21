"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function contactPage() {
  return (
    <div>
      <PageHero eyebrow="Support" title="Contact Us" subtitle="Reach the Tasks.cash support council." variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <GlassCard className="p-8 max-w-xl mx-auto"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><label className="text-sm text-purple-300">Name</label><input className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white" placeholder="Your name" /></div><div><label className="text-sm text-purple-300">Email</label><input type="email" className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white" placeholder="you@email.com" /></div><div><label className="text-sm text-purple-300">Message</label><textarea rows={4} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white" placeholder="How can we help?" /></div><PortalButton variant="gold" className="w-full">Send Message</PortalButton></form></GlassCard>
      </div>
    </div>
  );
}
