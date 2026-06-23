"use client";

import { GlassCard, LeaderboardRow, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function DashboardLeaderboardPage() {
  const myRank = 128;
  const myEntry = { rank: myRank, username: "You", level: 12, xp: 6500, coins: 2450 };

  return (
    <DashboardPageShell title="Global Rank" subtitle="Your position among portal warriors">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Your Rank" value={`#${myRank}`} icon="🏆" glow="gold" />
        <StatWidget label="Season" value="4" icon="📅" />
        <StatWidget label="Rank Change" value="+12" icon="📈" />
      </div>

      <GlassCard glow="gold" className="p-4 mb-6">
        <LeaderboardRow {...myEntry} isCurrentUser />
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="font-bold text-white mb-4">Top Warriors — Season 4</h2>
        {LEADERBOARD_MOCK.map((entry) => (
          <LeaderboardRow key={entry.rank} {...entry} />
        ))}
      </GlassCard>
    </DashboardPageShell>
  );
}
