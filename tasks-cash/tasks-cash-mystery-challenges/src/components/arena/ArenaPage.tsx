"use client";

import { PortalBackground } from "@/components/ui/PortalBackground";
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

/** Full-screen Challenges Arena — edge-to-edge cinematic layout */
export function ArenaPage() {
  return (
    <div className="relative w-screen min-h-screen overflow-x-hidden bg-black">
      <PortalBackground />

      {/* Minimal top nav — full width, no sidebar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex w-screen items-center justify-between border-b border-purple-500/15 bg-black/60 px-[clamp(1rem,4vw,3rem)] py-3 backdrop-blur-2xl">
        <a href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/main_logo.png" alt="Tasks.cash" className="h-8 md:h-10 w-auto object-contain" draggable={false} />
          <span className="hidden sm:block text-[10px] uppercase tracking-[0.3em] text-purple-400/60 font-semibold">
            Mystery Challenges
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest text-purple-400/60">
          <a href="#game-modes" className="hover:text-amber-300 transition-colors">Modes</a>
          <a href="#leaderboards" className="hover:text-amber-300 transition-colors">Rankings</a>
          <a href="#reward-pools" className="hover:text-amber-300 transition-colors">Rewards</a>
          <a href="#rules" className="hover:text-amber-300 transition-colors">Rules</a>
        </nav>
      </header>

      <main className="w-screen">
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
      </main>
    </div>
  );
}
