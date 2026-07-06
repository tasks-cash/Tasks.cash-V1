"use client";

import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { useContent } from "@/hooks/useContent";

export default function DuelArenaPage() {
  const { getText } = useContent("challenge", "duel-arena");

  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Mode"
        title={getText("hero", "title", "Duel Arena")}
        subtitle={getText(
          "hero",
          "subtitle",
          "Challenge another explorer head-to-head. Winner takes XP, coins, and glory."
        )}
      >
        <GlowCard glow="gold" className="p-8 md:p-12 text-center max-w-3xl mx-auto">
          <span className="text-6xl mb-6 block">🗡️</span>
          <h3 className="text-3xl font-black text-white mb-4">{getText("cards", "enterDuel", "Challenge a Rival")}</h3>
          <p className="text-purple-300/60 mb-8">
            Select an opponent from the leaderboard or accept an incoming duel invite. Best-of-three missions decide the victor.
          </p>
          <ArenaButton variant="gold" size="lg">
            {getText("buttons", "findOpponent", "Find Opponent")}
          </ArenaButton>
        </GlowCard>
      </SectionShell>
    </ChallengeShell>
  );
}
