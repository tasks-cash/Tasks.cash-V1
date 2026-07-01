import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";

export default function ExplorerDnaPage() {
  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Core System"
        title="Explorer DNA"
        subtitle="Build your Explorer DNA profile. Answer questions to unlock better missions and rewards."
      >
        <GlowCard glow="gold" className="p-8 md:p-12 max-w-2xl mx-auto text-center">
          <span className="text-6xl mb-6 block">🧬</span>
          <h3 className="text-2xl font-black text-white mb-4">Sign in to access Explorer DNA</h3>
          <p className="text-purple-300/60 text-sm mb-8">
            Explorer DNA lives on your main Tasks.cash account. Log in to answer DNA questions and improve mission recommendations.
          </p>
          <a href={`${MAIN_APP_URL}/explorer-dna`}>
            <ArenaButton variant="gold" size="lg">
              Open Explorer DNA
            </ArenaButton>
          </a>
        </GlowCard>
      </SectionShell>
    </ChallengeShell>
  );
}
