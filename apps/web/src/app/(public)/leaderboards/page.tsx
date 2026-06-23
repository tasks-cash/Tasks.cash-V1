"use client";

import Link from "next/link";
import { GlassCard, PortalButton, LeaderboardRow, MotionReveal } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, StatsBanner } from "@/components/pages/PublicSections";
import { LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function LeaderboardsPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Rankings" title="Global Leaderboards" subtitle="The elite warriors dominating the portal multiverse." variant="gold" />

      <StatsBanner stats={[
        { label: "Ranked Explorers", value: 12847, icon: "👥" },
        { label: "Season 4 Active", value: 1, icon: "🏆" },
        { label: "Top XP", value: 98500, icon: "⚡" },
        { label: "Prize Pool", value: 100000, suffix: " ◈", icon: "💰" },
      ]} />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <SectionHeader eyebrow="Season 4" title="Top Warriors" subtitle="Updated in real-time as explorers complete missions." />
        <GlassCard className="p-6">
          {LEADERBOARD_MOCK.map((entry) => (
            <MotionReveal key={entry.rank}>
              <LeaderboardRow
                rank={entry.rank}
                username={entry.username}
                level={entry.level}
                xp={entry.xp}
                coins={entry.coins}
              />
            </MotionReveal>
          ))}
        </GlassCard>
        <p className="text-center text-purple-400/50 text-sm mt-6">Showing top 5 of 12,847 ranked explorers</p>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Weekly Rankings", desc: "Resets every Monday. Top 10 earn bonus coins.", icon: "📅" },
            { title: "Monthly Champions", desc: "Season-long competition with legendary prizes.", icon: "👑" },
            { title: "Guild Leaderboards", desc: "Team up and compete as a guild for shared rewards.", icon: "⚔️" },
          ].map((item) => (
            <GlassCard key={item.title} className="p-6" hover>
              <span className="text-3xl">{item.icon}</span>
              <h3 className="font-bold text-white mt-3">{item.title}</h3>
              <p className="text-purple-200/60 text-sm mt-2">{item.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      <EpicCTA title="Climb the Rankings" subtitle="Complete missions, earn XP, and claim your place among legends." primaryLabel="Join the Competition" />
    </PublicPageWrapper>
  );
}
