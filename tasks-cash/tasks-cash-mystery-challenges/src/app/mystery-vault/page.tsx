"use client";

import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { useContent } from "@/hooks/useContent";

const VAULTS = [
  { name: "Bronze Vault", icon: "🥉", keys: 1 },
  { name: "Silver Vault", icon: "🥈", keys: 2 },
  { name: "Gold Vault", icon: "🥇", keys: 3 },
] as const;

export default function MysteryVaultPage() {
  const { getText } = useContent("challenge", "mystery-vault");

  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Vault"
        title={getText("hero", "title", "Mystery Vault")}
        subtitle={getText(
          "hero",
          "subtitle",
          "Spend vault keys to reveal hidden rewards — coins, badges, and legendary items."
        )}
      >
        <div className="grid sm:grid-cols-3 gap-4 md:gap-6">
          {VAULTS.map((vault, i) => (
            <GlowCard key={vault.name} glow={i === 2 ? "gold" : "violet"} className="p-6 text-center">
              <span className="text-4xl mb-3 block">{vault.icon}</span>
              <h3 className="text-lg font-bold text-white mb-2">{vault.name}</h3>
              <p className="text-xs text-purple-400/50 mb-4">
                Requires {vault.keys} vault key{vault.keys > 1 ? "s" : ""}
              </p>
              <ArenaButton variant={i === 2 ? "gold" : "purple"} size="md" className="w-full">
                {getText("buttons", "openVault", "Open Vault")}
              </ArenaButton>
            </GlowCard>
          ))}
        </div>
      </SectionShell>
    </ChallengeShell>
  );
}
