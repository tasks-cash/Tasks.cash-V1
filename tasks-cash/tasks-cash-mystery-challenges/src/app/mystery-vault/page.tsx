import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";

export default function MysteryVaultPage() {
  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Vault"
        title="Mystery Vault"
        subtitle="Spend vault keys to reveal hidden rewards — coins, badges, and legendary items."
      >
        <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
          {["Bronze Vault", "Silver Vault", "Gold Vault"].map((name, i) => (
            <GlowCard key={name} glow={i === 2 ? "gold" : "violet"} className="p-6 text-center">
              <span className="text-4xl mb-3 block">{["🥉", "🥈", "🥇"][i]}</span>
              <h3 className="text-lg font-bold text-white mb-2">{name}</h3>
              <p className="text-xs text-purple-400/50 mb-4">Requires {i + 1} vault key{i > 0 ? "s" : ""}</p>
              <ArenaButton variant={i === 2 ? "gold" : "purple"} size="md" className="w-full">
                Open Vault
              </ArenaButton>
            </GlowCard>
          ))}
        </div>
      </SectionShell>
    </ChallengeShell>
  );
}
