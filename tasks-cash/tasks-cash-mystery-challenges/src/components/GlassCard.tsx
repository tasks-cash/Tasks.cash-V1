"use client";

import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "purple" | "gold" | "violet" | "none";
}

export function GlassCard({ children, className, glow = "purple" }: GlassCardProps) {
  const glowClass =
    glow === "gold" ? "border-amber-400/25 shadow-glow-gold" :
    glow === "violet" ? "border-violet-400/25 shadow-glow-violet" :
    glow === "none" ? "border-white/10" : "border-purple-500/25 shadow-glow-purple";

  return (
    <div className={cn("rounded-2xl border backdrop-blur-xl bg-gradient-to-br from-purple-950/40 to-black/80", glowClass, className)}>
      {children}
    </div>
  );
}
