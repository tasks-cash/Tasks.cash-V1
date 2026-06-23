"use client";

import React from "react";
import { cn } from "./lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "purple" | "gold" | "violet" | "none";
  hover?: boolean;
  depth?: boolean;
}

/** Stable glassmorphism card — purple/gold portal theme */
export function GlassCard({
  children,
  className = "",
  glow = "purple",
  hover = true,
  depth = true,
}: GlassCardProps) {
  const glowClass =
    glow === "purple"
      ? "shadow-glow-purple border-purple-500/25"
      : glow === "gold"
        ? "shadow-glow-gold border-amber-400/25"
        : glow === "violet"
          ? "border-violet-400/25 shadow-glow-violet"
          : "border-white/10";

  return (
    <div
      className={cn(
        "relative rounded-2xl border backdrop-blur-xl overflow-hidden",
        "bg-gradient-to-br from-purple-950/40 via-black/60 to-black/90",
        depth && "before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.04] before:to-transparent",
        glowClass,
        hover && "transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/40 hover:shadow-glow-purple",
        className
      )}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
