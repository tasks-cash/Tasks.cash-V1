"use client";

import { GlassCard, GlowText, StatWidget, PortalButton, Input, Label, LevelBar, NotificationItem } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <GlowText as="h1" className="text-3xl">Leaderboard Rank</GlowText>
        <p className="text-purple-300/60 mt-1">Manage your portal journey</p>
      </div>
      <GlassCard className="p-6"><p className="text-amber-400 font-bold text-2xl mb-4">Your Rank: #128</p><p className="text-purple-200/60">Keep completing missions to climb the global leaderboard.</p></GlassCard>
    </div>
  );
}
