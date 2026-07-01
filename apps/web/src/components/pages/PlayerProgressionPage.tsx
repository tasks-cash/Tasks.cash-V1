"use client";

import { useEffect, useState } from "react";
import type { PlayerProgressionData } from "@/types/player-progression";
import { EMPTY_PLAYER_PROGRESSION } from "@/data/player-progression-data";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { GlassCard } from "@tasks-cash/ui";
import { apiFetch } from "@/lib/api";
import { ProgressionHeroHeader } from "@/components/progression/ProgressionHeroHeader";
import { GlobalLevelPanel } from "@/components/progression/GlobalLevelPanel";
import { ExplorerRankPanel } from "@/components/progression/ExplorerRankPanel";
import { ExplorerAttributesPanel } from "@/components/progression/ExplorerAttributesPanel";
import { BadgesPanel } from "@/components/progression/BadgesPanel";
import { AchievementsPanel } from "@/components/progression/AchievementsPanel";

type DashboardData = {
  xp?: number;
  level?: number;
  xpToNextLevel?: number;
  xpProgress?: number;
  rank?: number;
  referralCode?: string;
  badges?: string[];
  achievements?: string[];
  explorerRank?: string;
  playerTitle?: string;
  streakDays?: number;
  profile?: { username?: string; avatar?: string; joinDate?: string };
};

function mapDashboardToProgression(dashboard: DashboardData, username: string): PlayerProgressionData {
  const base = EMPTY_PLAYER_PROGRESSION;
  return {
    ...base,
    profile: {
      ...base.profile,
      username: dashboard.profile?.username ?? username,
      avatar: dashboard.profile?.avatar ?? "🎯",
      joinDate: dashboard.profile?.joinDate ?? "—",
      currentRankId: dashboard.explorerRank ?? base.profile.currentRankId,
    },
    globalLevel: {
      level: dashboard.level ?? 1,
      currentXp: dashboard.xp ?? 0,
      requiredXp: dashboard.xpToNextLevel ?? 1000,
      nextLevel: (dashboard.level ?? 1) + 1,
      nextReward: "",
    },
    badges: (dashboard.badges ?? []).map((name, i) => ({
      id: `badge-${i}`,
      name,
      icon: "🏅",
      rarity: "common" as const,
      unlocked: true,
      requirement: name,
    })),
    achievementCategories: base.achievementCategories.map((cat) => ({
      ...cat,
      unlocked: (dashboard.achievements ?? []).length,
    })),
    statistics: {
      ...base.statistics,
      daysActive: dashboard.streakDays ?? 0,
      totalXpEarned: dashboard.xp ?? 0,
      globalRank: dashboard.rank ?? 0,
    },
  };
}

export function PlayerProgressionPage() {
  const [data, setData] = useState<PlayerProgressionData>(EMPTY_PLAYER_PROGRESSION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const [meRes, dashRes] = await Promise.all([
        apiFetch<{ username?: string }>("/api/auth/me"),
        apiFetch<DashboardData>("/api/users/dashboard"),
      ]);
      if (dashRes.success && dashRes.data) {
        setData(mapDashboardToProgression(dashRes.data, meRes.data?.username ?? "Explorer"));
      } else {
        setError(dashRes.error ?? "Failed to load progression");
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <GameHubLayout
      breadcrumb="Hub · Player Progression"
      eyebrow="Character Sheet"
      title="PLAYER PROGRESSION"
      subtitle="Explorer rank, global level, attributes, badges, and achievements."
    >
      {loading && <p className="text-purple-400/50 text-sm mb-6">Loading progression…</p>}
      {error && !loading && <p className="text-amber-400 text-sm mb-6">{error}</p>}

      {!loading && !error && (
        <div className="space-y-14 md:space-y-20 pb-12">
          <ProgressionHeroHeader data={data} />
          <ExplorerRankPanel data={data} />
          <GlobalLevelPanel data={data} />
          <ExplorerAttributesPanel attributes={data.attributes} />
          {data.badges.length === 0 ? (
            <GlassCard className="p-6 text-center text-purple-400/60">No badges earned yet.</GlassCard>
          ) : (
            <BadgesPanel badges={data.badges} />
          )}
          <AchievementsPanel categories={data.achievementCategories} />
        </div>
      )}
    </GameHubLayout>
  );
}
