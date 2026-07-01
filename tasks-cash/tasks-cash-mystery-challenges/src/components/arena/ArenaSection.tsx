"use client";

import { cn } from "@/lib/utils";

interface ArenaSectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ArenaSection({ id, eyebrow, title, subtitle, children, className }: ArenaSectionProps) {
  return (
    <section id={id} className={cn("game-section scroll-mt-28", className)}>
      <div className="game-section-header">
        {eyebrow && <p className="game-eyebrow mb-3">{eyebrow}</p>}
        <h2 className="section-title glow-purple">{title}</h2>
        {subtitle && <p className="mt-4 game-desc max-w-3xl text-lg">{subtitle}</p>}
        <div className="portal-divider mt-8 max-w-xs opacity-50" />
      </div>
      {children}
    </section>
  );
}
