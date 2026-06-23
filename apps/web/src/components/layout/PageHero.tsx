"use client";

import { BrandLogo, GlowText, MotionReveal } from "@tasks-cash/ui";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  variant?: "default" | "gold";
  showLogo?: boolean;
}

export function PageHero({ eyebrow, title, subtitle, variant = "default", showLogo = true }: PageHeroProps) {
  return (
    <section className="relative py-20 md:py-28 px-4 text-center overflow-hidden">
      <div className="portal-ring absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none animate-portal-spin" />
      <MotionReveal className="relative z-10 max-w-3xl mx-auto">
        {showLogo && <BrandLogo size="sm" href="/" className="mx-auto mb-6" animated={false} />}
        {eyebrow && (
          <p className="text-[10px] md:text-sm uppercase tracking-[0.35em] text-purple-400/70 mb-4 font-semibold">
            {eyebrow}
          </p>
        )}
        <GlowText as="h1" variant={variant === "gold" ? "gold" : "purple"} className="text-4xl md:text-5xl lg:text-6xl mb-4 font-[family-name:var(--font-cinzel)]">
          {title}
        </GlowText>
        {subtitle && <p className="text-purple-200/60 text-lg max-w-2xl mx-auto">{subtitle}</p>}
        <div className="portal-divider mt-10 max-w-md mx-auto" />
      </MotionReveal>
    </section>
  );
}
