"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  ProfileCard,
  CurrencyCardGrid,
  LevelCardGrid,
  ChallengePortalCard,
  MysteryModePortalCard,
  TopExplorersPanel,
  PlayerActivityFeed,
  GlassCard,
  GameButton,
} from "@tasks-cash/ui";
import { useGame } from "@/components/game/GameProvider";
import { apiFetch } from "@/lib/api";
import { buildRPGProgress } from "@tasks-cash/utils";
import type { DashboardStats, RPGStatType, ICurrencies } from "@tasks-cash/types";
import type { ExplorerEntry } from "@tasks-cash/ui";
import type { ActivityEntry } from "@tasks-cash/ui";

const DASHBOARD_LEVEL_STATS: RPGStatType[] = [
  "global",
  "strength",
  "intelligence",
  "energy",
  "life",
  "speed",
];

const DEFAULT_CURRENCIES: ICurrencies = {
  bronze: 0,
  silver: 0,
  gold: 0,
  diamonds: 0,
  crystals: 0,
  legendTokens: 0,
  mythicCoins: 0,
  portalEnergy: 0,
};

export default function DashboardOverviewPage() {
  const { profile, loading: gameLoading, claimDailyReward } = useGame();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [topExplorers, setTopExplorers] = useState<ExplorerEntry[]>([]);

  useEffect(() => {
    apiFetch<DashboardStats>("/api/users/dashboard").then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
        setStatsError("");
      } else if (res.error) {
        setStatsError(res.error);
      }
    });

    fetch("/api/leaderboards?limit=10")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setTopExplorers(
            res.data.map((e: { rank: number; username: string; level: number; xp: number; coins: number }) => ({
              rank: e.rank,
              username: e.username,
              level: e.level,
              xp: e.xp,
              rewards: `${e.coins} ◈`,
              badge: "⚔️",
            }))
          );
        }
      })
      .catch(() => setTopExplorers([]));
  }, []);

  if (gameLoading && !profile && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-6">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-purple-500 border-t-amber-400" />
        <p className="text-purple-400/50 text-xs uppercase tracking-[0.3em]">Syncing Command Center...</p>
      </div>
    );
  }

  const display = stats ?? {
    coins: 0,
    xp: 0,
    level: 1,
    levelTitle: "Explorer",
    xpToNextLevel: 1000,
    xpProgress: 0,
    completedMissions: 0,
    rank: 0,
    referralCount: 0,
    referralCode: "",
  };

  const currencies = profile?.currencies ?? stats?.currencies ?? DEFAULT_CURRENCIES;

  const defaultRpgStats = {
    global: { level: display.level, xp: display.xp },
    strength: { level: 1, xp: 0 },
    intelligence: { level: 1, xp: 0 },
    energy: { level: 1, xp: 0 },
    life: { level: 1, xp: 0 },
    speed: { level: 1, xp: 0 },
    luck: { level: 1, xp: 0 },
    defense: { level: 1, xp: 0 },
    reputation: { level: 1, xp: 0 },
  };

  const rpgProgress =
    profile?.rpgStats && typeof profile.rpgStats.global?.progress === "number"
      ? profile.rpgStats
      : buildRPGProgress(defaultRpgStats);

  const activeChallenges = 0;
  const activities: ActivityEntry[] = [];

  return (
    <div>
      <PageHeader
        title="Explorer Command Center"
        subtitle="Your RPG progression hub — currencies, levels, challenges, and secrets."
        badge="Player Dashboard"
      />

      {statsError && (
        <p className="text-amber-400/80 text-sm mb-4">Dashboard sync error: {statsError}</p>
      )}

      {profile && <ProfileCard profile={profile} className="mb-8" />}

      {profile?.dailyRewardAvailable && (
        <GlassCard glow="gold" className="p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full border border-amber-400/40 bg-amber-950/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">
              Daily Reward
            </span>
            <h3 className="text-lg font-bold text-amber-300">Daily Mystery Reward Ready</h3>
          </div>
          <GameButton variant="gold" pulse onClick={claimDailyReward} data-sound="daily-reward">
            Claim Daily Reward
          </GameButton>
        </GlassCard>
      )}

      {/* Mystery Mode — full-width premium entry */}
      <section className="mb-10">
        <MysteryModePortalCard href="/mystery-challenges" secretCount={5} />
      </section>

      {/* Challenge portal */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <ChallengePortalCard href="/mystery-challenges" activeCount={activeChallenges} />
      </div>

      {/* Currency cards */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-white mb-4 font-[family-name:var(--font-cinzel)]">Currency Vault</h2>
        <CurrencyCardGrid currencies={currencies} historyMap={{}} />
      </section>

      {/* RPG level cards */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-white mb-4 font-[family-name:var(--font-cinzel)]">Player Levels</h2>
        <LevelCardGrid stats={rpgProgress} statKeys={DASHBOARD_LEVEL_STATS} />
      </section>

      {/* Top 10 + Activity */}
      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <TopExplorersPanel entries={topExplorers} />
        <PlayerActivityFeed activities={activities} />
      </div>
    </div>
  );
}
