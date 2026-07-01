import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import Link from "next/link";

export default function RaidArenaPage() {
  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Mode"
        title="Raid Arena"
        subtitle="Join timed raids with your alliance. Coordinate attacks and share prize pools."
      >
        <div className="grid md:grid-cols-2 gap-6">
          <GlowCard glow="violet" className="p-8">
            <span className="text-5xl mb-4 block">⚔️</span>
            <h3 className="text-2xl font-black text-white mb-3">Live Raids</h3>
            <p className="text-purple-300/60 text-sm mb-6">
              Portal raids open on a schedule. Enter before the gate closes to compete for massive coin pools.
            </p>
            <ArenaButton variant="purple">Browse Live Raids</ArenaButton>
          </GlowCard>
          <GlowCard glow="gold" className="p-8">
            <span className="text-5xl mb-4 block">🏆</span>
            <h3 className="text-2xl font-black text-white mb-3">Your Raid Stats</h3>
            <p className="text-purple-300/60 text-sm mb-6">
              Track wins, contribution score, and alliance rank across the current season.
            </p>
            <Link href="/leaderboards">
              <ArenaButton variant="gold">View Rankings</ArenaButton>
            </Link>
          </GlowCard>
        </div>
      </SectionShell>
    </ChallengeShell>
  );
}
