"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: string;
  glow?: "purple" | "gold" | "violet";
  className?: string;
}

/** Premium stat card with 3D depth and glow border */
export function StatCard({ label, value, icon, trend, glow = "purple", className }: StatCardProps) {
  const glowStyles = {
    purple: "border-purple-500/25 shadow-glow-purple from-purple-950/50",
    gold: "border-amber-400/25 shadow-glow-gold from-amber-950/40",
    violet: "border-violet-400/25 shadow-[0_0_20px_rgba(168,85,247,0.3)] from-violet-950/40",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "relative rounded-2xl border p-5 backdrop-blur-xl overflow-hidden",
        "bg-gradient-to-br to-black/70",
        glowStyles[glow],
        "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.03] before:to-transparent before:pointer-events-none",
        className
      )}
    >
      <div className="relative z-10 flex items-center justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.2em] text-purple-300/60 font-semibold">{label}</span>
        {icon && <span className="text-2xl drop-shadow-lg">{icon}</span>}
      </div>
      <p className={cn("relative z-10 text-3xl font-black tracking-tight", glow === "gold" ? "text-amber-400" : "text-white")}>
        {value}
      </p>
      {trend && <p className="relative z-10 mt-2 text-xs text-emerald-400 font-medium">{trend}</p>}
    </motion.div>
  );
}
