"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard, PortalButton, LeaderboardRow, MotionReveal } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, StatsBanner } from "@/components/pages/PublicSections";
import type { ILeaderboardEntry } from "@tasks-cash/types";

export default function LeaderboardsPage() {
  const [entries, setEntries] = useState<ILeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/leaderboards?limit=10")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setEntries(res.data);
          setError("");
        } else {
          setEntries([]);
          setError(res.error ?? "Failed to load leaderboard");
        }
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setError("Failed to load leaderboard");
        setLoading(false);
      });
  }, []);

  const topXp = entries[0]?.xp ?? 0;

  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Rankings" title="Global Leaderboards" subtitle="The elite warriors dominating the portal multiverse." variant="gold" />

      <StatsBanner stats={[
        { label: "Ranked Explorers", value: entries.length, icon: "👥" },
        { label: "Top XP", value: topXp, icon: "⚡" },
        { label: "Showing", value: entries.length, icon: "🏆" },
      ]} />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <SectionHeader eyebrow="Live Rankings" title="Top Warriors" subtitle="Updated from the database as explorers complete missions." />
        {loading && <p className="text-purple-400/50 text-sm text-center mb-4">Loading rankings...</p>}
        {error && <p className="text-amber-400 text-sm text-center mb-4">{error}</p>}
        <GlassCard className="p-6">
          {!loading && entries.length === 0 && !error && (
            <p className="text-purple-400/60 text-center py-8">No ranked explorers yet.</p>
          )}
          {entries.map((entry) => (
            <MotionReveal key={entry.userId}>
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
      </div>

      <EpicCTA title="Climb the Rankings" subtitle="Complete missions, earn XP, and claim your place among legends." primaryLabel="Join the Competition" />
    </PublicPageWrapper>
  );
}
