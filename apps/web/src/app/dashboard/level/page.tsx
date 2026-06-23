"use client";

import {
  PageHeader,
  RPGStatBar,
  LevelBadge,
  GlassCard,
  GameButton,
} from "@tasks-cash/ui";
import { useGame } from "@/components/game/GameProvider";
import { EXPLORER_RANKS } from "@tasks-cash/utils";
import type { RPGStatType } from "@tasks-cash/types";

export default function LevelPage() {
  const { profile } = useGame();

  const rpgStats =
    profile?.rpgStats && typeof profile.rpgStats.global?.progress === "number"
      ? profile.rpgStats
      : {
          global: { level: 12, xp: 6500, xpToNextLevel: 10000, progress: 65 },
          strength: { level: 8, xp: 1200, xpToNextLevel: 500, progress: 40 },
          intelligence: { level: 6, xp: 800, xpToNextLevel: 400, progress: 55 },
          speed: { level: 10, xp: 2000, xpToNextLevel: 600, progress: 72 },
          luck: { level: 7, xp: 950, xpToNextLevel: 450, progress: 48 },
          life: { level: 9, xp: 1500, xpToNextLevel: 550, progress: 60 },
          energy: { level: 11, xp: 2200, xpToNextLevel: 700, progress: 80 },
          defense: { level: 5, xp: 600, xpToNextLevel: 350, progress: 35 },
          reputation: { level: 8, xp: 1100, xpToNextLevel: 500, progress: 52 },
        };

  return (
    <div>
      <PageHeader
        title="Level & Progression"
        subtitle="Global level, explorer rank, and all RPG stat trees."
        badge="RPG System"
      />

      <div className="flex flex-col items-center mb-10">
        <LevelBadge level={profile?.globalLevel ?? 12} title={profile?.explorerRank ?? "Void Walker"} size="lg" />
        <p className="text-purple-300/60 text-sm mt-4 text-center max-w-md">
          Level up to unlock new missions, worlds, achievements, and treasure chests.
        </p>
      </div>

      <GlassCard glow="gold" className="p-6 mb-8">
        <h2 className="text-lg font-bold text-amber-300 mb-4">Explorer Rank Ladder</h2>
        <div className="space-y-2">
          {EXPLORER_RANKS.map((tier) => (
            <div
              key={tier.rank}
              className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                (profile?.globalLevel ?? 12) >= tier.minLevel
                  ? "border-amber-400/30 bg-amber-950/20 text-amber-200"
                  : "border-purple-500/10 bg-black/30 text-purple-400/40"
              }`}
            >
              <span className="font-semibold">{tier.rank}</span>
              <span className="text-sm">Level {tier.minLevel}+</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <h2 className="text-xl font-black text-white mb-4 font-[family-name:var(--font-cinzel)]">All Stats</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {(Object.keys(rpgStats) as RPGStatType[]).map((stat) => (
          <RPGStatBar key={stat} stat={stat} data={rpgStats[stat]} />
        ))}
      </div>

      <GameButton variant="purple" pulse data-sound="level-up">
        Train Stats (+50 XP)
      </GameButton>
    </div>
  );
}
