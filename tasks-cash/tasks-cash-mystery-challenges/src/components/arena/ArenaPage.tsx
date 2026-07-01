"use client";

import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { HeroSection } from "./HeroSection";
import { GameModeCardsSection } from "./GameModeCardsSection";
import { VideoHunterSection } from "./VideoHunterSection";
import { ReferralArenaSection } from "./ReferralArenaSection";
import { IdentityChallengeSection } from "./IdentityChallengeSection";
import { SpecialMissionsSection } from "./SpecialMissionsSection";
import { LeaderboardsSection } from "./LeaderboardsSection";
import { RewardPoolsSection } from "./RewardPoolsSection";
import { RulesSection } from "./RulesSection";
import { FinalCTASection } from "./FinalCTASection";

/** Challenges Arena hub — full-screen cinematic layout */
export function ArenaPage() {
  return (
    <ChallengeShell>
      <HeroSection />
      <GameModeCardsSection />
      <VideoHunterSection />
      <ReferralArenaSection />
      <IdentityChallengeSection />
      <SpecialMissionsSection />
      <LeaderboardsSection />
      <RewardPoolsSection />
      <RulesSection />
      <FinalCTASection />
    </ChallengeShell>
  );
}
