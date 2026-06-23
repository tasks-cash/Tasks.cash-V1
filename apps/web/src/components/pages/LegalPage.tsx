"use client";

import { GlassCard, MotionReveal } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";

interface LegalSection {
  title: string;
  content: string;
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  sections: LegalSection[];
  updated?: string;
}

export function LegalPage({ eyebrow, title, subtitle, sections, updated = "June 21, 2026" }: LegalPageProps) {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} variant="gold" />
      <div className="mx-auto max-w-3xl px-4 pb-24">
        <p className="text-center text-xs text-purple-400/50 mb-10 uppercase tracking-widest">Last updated: {updated}</p>
        <div className="space-y-6">
          {sections.map((section, i) => (
            <MotionReveal key={section.title} delay={i * 0.05}>
              <GlassCard className="p-6 md:p-8">
                <h2 className="text-lg font-bold text-white mb-3">{section.title}</h2>
                <p className="text-purple-200/60 text-sm leading-relaxed">{section.content}</p>
              </GlassCard>
            </MotionReveal>
          ))}
        </div>
      </div>
    </PublicPageWrapper>
  );
}
