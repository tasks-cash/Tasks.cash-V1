"use client";

import { PLAYER_PROGRESSION } from "@/data/player-progression-data";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { ProgressionHeroHeader } from "@/components/progression/ProgressionHeroHeader";
import { GlobalLevelPanel } from "@/components/progression/GlobalLevelPanel";
import { ExplorerRankPanel } from "@/components/progression/ExplorerRankPanel";
import { ExplorerAttributesPanel } from "@/components/progression/ExplorerAttributesPanel";
import { BadgesPanel } from "@/components/progression/BadgesPanel";
import { AchievementsPanel } from "@/components/progression/AchievementsPanel";

export function PlayerProgressionPage() {
  const data = PLAYER_PROGRESSION;

  return (
    <GameHubLayout
      breadcrumb="Hub · Player Progression"
      eyebrow="Character Sheet"
      title="PLAYER PROGRESSION"
      subtitle="Explorer rank, global level, attributes, badges, and achievements."
    >
      <ProgressionHeroHeader />

      <div className="space-y-14 md:space-y-20 pb-12">
        <ExplorerRankPanel />
        <GlobalLevelPanel />
        <ExplorerAttributesPanel attributes={data.attributes} />
        <BadgesPanel badges={data.badges} />
        <AchievementsPanel categories={data.achievementCategories} />
      </div>
    </GameHubLayout>
  );
}
