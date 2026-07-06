"use client";

import { ChallengeShell } from "@/components/layout/ChallengeShell";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { challengeRoutes } from "@/config/routes";
import { useContent } from "@/hooks/useContent";
import { useLocale } from "@/i18n/I18nProvider";
import { buildMainLoginUrl } from "@/lib/auth/redirect";

export function ExplorerDnaSignIn() {
  const locale = useLocale();
  const { getText } = useContent("challenge", "explorer-dna");
  const loginUrl = buildMainLoginUrl(challengeRoutes(locale).explorerDna, locale);

  return (
    <ChallengeShell>
      <SectionShell
        eyebrow="Core System"
        title={getText("hero", "title", "Explorer DNA")}
        subtitle={getText(
          "hero",
          "subtitle",
          "Build your Explorer DNA profile. Answer questions to unlock better missions and rewards."
        )}
      >
        <GlowCard glow="gold" className="p-8 md:p-12 max-w-2xl mx-auto text-center">
          <span className="text-6xl mb-6 block">🧬</span>
          <h3 className="text-2xl font-black text-white mb-4">
            {getText("cards", "signInTitle", "Sign in to access Explorer DNA")}
          </h3>
          <p className="text-purple-300/60 text-sm mb-8">
            {getText(
              "cards",
              "signInDesc",
              "Explorer DNA lives on your main Tasks.cash account. Log in to answer DNA questions and improve mission recommendations."
            )}
          </p>
          <a href={loginUrl}>
            <ArenaButton variant="gold" size="lg">
              {getText("buttons", "openDna", "Open Explorer DNA")}
            </ArenaButton>
          </a>
        </GlowCard>
      </SectionShell>
    </ChallengeShell>
  );
}
