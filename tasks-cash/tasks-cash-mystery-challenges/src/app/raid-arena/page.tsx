"use client";

import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import Link from "next/link";
import { useContent } from "@/hooks/useContent";
import { useLocale } from "@/i18n/I18nProvider";
import { withLocalePrefix } from "@/i18n/locale-path";

export default function RaidArenaPage() {
  const locale = useLocale();
  const { getText } = useContent("challenge", "raid-arena");

  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Mode"
        title={getText("hero", "title", "Raid Arena")}
        subtitle={getText(
          "hero",
          "subtitle",
          "Join timed raids with your alliance. Coordinate attacks and share prize pools."
        )}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <GlowCard glow="violet" className="p-8">
            <span className="text-5xl mb-4 block">⚔️</span>
            <h3 className="text-2xl font-black text-white mb-3">{getText("cards", "liveRaids", "Live Raids")}</h3>
            <p className="text-purple-300/60 text-sm mb-6">
              {getText(
                "cards",
                "liveRaidsDesc",
                "Portal raids open on a schedule. Enter before the gate closes to compete for massive coin pools."
              )}
            </p>
            <ArenaButton variant="purple">{getText("buttons", "browseRaids", "Browse Live Raids")}</ArenaButton>
          </GlowCard>
          <GlowCard glow="gold" className="p-8">
            <span className="text-5xl mb-4 block">🏆</span>
            <h3 className="text-2xl font-black text-white mb-3">{getText("cards", "raidStats", "Your Raid Stats")}</h3>
            <p className="text-purple-300/60 text-sm mb-6">
              Track wins, contribution score, and alliance rank across the current season.
            </p>
            <Link href={withLocalePrefix("/leaderboards", locale)}>
              <ArenaButton variant="gold">{getText("buttons", "viewRankings", "View Rankings")}</ArenaButton>
            </Link>
          </GlowCard>
        </div>
      </SectionShell>
    </ChallengeShell>
  );
}
