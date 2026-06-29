"use client";

import { cn } from "@/lib/utils";

interface ProgressionSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ProgressionSection({ id, eyebrow, title, subtitle, children, className }: ProgressionSectionProps) {
  return (
    <section id={id} className={cn("prog-section relative w-full scroll-mt-24", className)}>
      <div className="mb-6 md:mb-8">
        <p className="text-[10px] uppercase tracking-[0.35em] text-purple-400/50 font-bold mb-2">{eyebrow}</p>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm md:text-base text-purple-300/50 mt-2 max-w-3xl">{subtitle}</p>}
        <div className="portal-divider mt-5 opacity-50" />
      </div>
      {children}
    </section>
  );
}
