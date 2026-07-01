import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";

export default function DuelArenaPage() {
  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Mode"
        title="Duel Arena"
        subtitle="Challenge another explorer head-to-head. Winner takes XP, coins, and glory."
      >
        <GlowCard glow="gold" className="p-8 md:p-12 text-center max-w-3xl mx-auto">
          <span className="text-6xl mb-6 block">🗡️</span>
          <h3 className="text-3xl font-black text-white mb-4">Challenge a Rival</h3>
          <p className="text-purple-300/60 mb-8">
            Select an opponent from the leaderboard or accept an incoming duel invite. Best-of-three missions decide the victor.
          </p>
          <ArenaButton variant="gold" size="lg">
            Find Opponent
          </ArenaButton>
        </GlowCard>
      </SectionShell>
    </ChallengeShell>
  );
}
