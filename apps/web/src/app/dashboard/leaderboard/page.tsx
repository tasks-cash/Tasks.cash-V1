"use client";

import { useEffect, useState } from "react";
import type { ILeaderboardEntry } from "@tasks-cash/types";
import { GlassCard, LeaderboardRow, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { apiFetch } from "@/lib/api";

export default function DashboardLeaderboardPage() {
  const [entries, setEntries] = useState<ILeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await apiFetch<ILeaderboardEntry[]>("/api/leaderboards");
      if (res.success && res.data) {
        setEntries(res.data);
      } else {
        setError(res.error ?? "Failed to load leaderboard");
      }
      setLoading(false);
    }
    load();
  }, []);

  const myEntry = entries[0];
  const myRank = myEntry?.rank ?? "—";

  return (
    <DashboardPageShell title="Global Rank" subtitle="Your position among portal warriors">
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading leaderboard…</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Your Rank" value={typeof myRank === "number" ? `#${myRank}` : myRank} icon="🏆" glow="gold" />
        <StatWidget label="Players" value={entries.length} icon="📅" />
        <StatWidget label="Top XP" value={entries[0]?.xp ?? 0} icon="📈" />
      </div>

      {myEntry && (
        <GlassCard glow="gold" className="p-4 mb-6">
          <LeaderboardRow rank={myEntry.rank} username={myEntry.username} level={myEntry.level} xp={myEntry.xp} coins={myEntry.coins} isCurrentUser />
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <h2 className="font-bold text-white mb-4">Top Warriors</h2>
        {entries.length === 0 && !loading ? (
          <p className="text-purple-400/50 text-sm">No leaderboard entries yet.</p>
        ) : (
          entries.map((entry) => <LeaderboardRow key={entry.userId ?? entry.rank} {...entry} />)
        )}
      </GlassCard>
    </DashboardPageShell>
  );
}
