"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard, GlowText, PortalButton, MotionReveal, MotionStagger, MotionStaggerItem, StatWidget } from "@tasks-cash/ui";
import { AnimatedCounter } from "@/components/homepage/shared/AnimatedCounter";

interface EpicCTAProps {
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function EpicCTA({
  title = "Ready to Enter the Portal?",
  subtitle = "Join millions of explorers conquering missions across dimensions.",
  primaryHref = "/register",
  primaryLabel = "Begin Your Journey",
  secondaryHref = "/worlds",
  secondaryLabel = "Explore Worlds",
}: EpicCTAProps) {
  return (
    <section className="relative py-24 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-amber-900/10 pointer-events-none" />
      <div className="portal-ring absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 opacity-10" />
      <MotionReveal className="relative z-10 mx-auto max-w-3xl text-center">
        <GlowText variant="gold" className="text-3xl md:text-4xl mb-4">
          {title}
        </GlowText>
        <p className="text-purple-200/60 mb-8 text-lg">{subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href={primaryHref}>
            <PortalButton variant="gold" size="lg">{primaryLabel}</PortalButton>
          </Link>
          {secondaryHref && (
            <Link href={secondaryHref}>
              <PortalButton variant="secondary" size="lg">{secondaryLabel}</PortalButton>
            </Link>
          )}
        </div>
      </MotionReveal>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({ eyebrow, title, subtitle, centered = true }: SectionHeaderProps) {
  return (
    <MotionReveal className={`mb-12 ${centered ? "text-center max-w-2xl mx-auto" : ""}`}>
      {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-purple-400/70 mb-3">{eyebrow}</p>}
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h2>
      {subtitle && <p className="text-purple-200/60">{subtitle}</p>}
    </MotionReveal>
  );
}

interface StatsBannerProps {
  stats: { label: string; value: number; suffix?: string; icon: string; live?: boolean }[];
}

export function StatsBanner({ stats }: StatsBannerProps) {
  return (
    <section className="py-16 px-4 border-y border-purple-500/10 bg-purple-950/20">
      <MotionStagger className="mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <MotionStaggerItem key={s.label}>
            <GlassCard className="p-6 text-center" hover>
              <span className="text-2xl mb-2 block">{s.icon}</span>
              <p className="text-2xl md:text-3xl font-black text-amber-400">
                <AnimatedCounter target={s.value} suffix={s.suffix ?? ""} live={s.live} liveVariance={s.live ? 3 : 0} />
              </p>
              <p className="text-xs uppercase tracking-widest text-purple-400/60 mt-2">{s.label}</p>
            </GlassCard>
          </MotionStaggerItem>
        ))}
      </MotionStagger>
    </section>
  );
}

interface FeatureGridProps {
  items: { icon: string; title: string; desc: string; glow?: "gold" | "purple" }[];
  columns?: 2 | 3 | 4;
}

export function FeatureGrid({ items, columns = 3 }: FeatureGridProps) {
  const gridClass = columns === 2 ? "md:grid-cols-2" : columns === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3";
  return (
    <MotionStagger className={`grid gap-6 ${gridClass}`}>
      {items.map((item) => (
        <MotionStaggerItem key={item.title}>
          <GlassCard glow={item.glow} className="p-6 h-full" hover>
            <span className="text-3xl">{item.icon}</span>
            <h3 className="text-lg font-bold text-white mt-4">{item.title}</h3>
            <p className="text-purple-200/60 text-sm mt-2 leading-relaxed">{item.desc}</p>
          </GlassCard>
        </MotionStaggerItem>
      ))}
    </MotionStagger>
  );
}

interface TimelineProps {
  items: { year: string; event: string }[];
}

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-amber-400/30 to-transparent md:-translate-x-1/2" />
      {items.map((item, i) => (
        <MotionReveal key={item.year} delay={i * 0.1}>
          <div className={`relative flex items-center gap-6 mb-10 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
            <div className="hidden md:block flex-1" />
            <motion.div
              className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full bg-amber-400 shadow-glow-gold md:-translate-x-1/2 z-10"
              whileInView={{ scale: [0, 1.2, 1] }}
              viewport={{ once: true }}
            />
            <GlassCard className="ml-10 md:ml-0 flex-1 p-5">
              <p className="text-amber-400 font-bold text-sm">{item.year}</p>
              <p className="text-white mt-1">{item.event}</p>
            </GlassCard>
          </div>
        </MotionReveal>
      ))}
    </div>
  );
}

export function PageStatsRow({ stats }: { stats: { label: string; value: string | number; icon: string; glow?: "gold" | "purple" }[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {stats.map((s, i) => (
        <MotionReveal key={s.label} delay={i * 0.05}>
          <StatWidget label={s.label} value={s.value} icon={s.icon} glow={s.glow} />
        </MotionReveal>
      ))}
    </div>
  );
}
