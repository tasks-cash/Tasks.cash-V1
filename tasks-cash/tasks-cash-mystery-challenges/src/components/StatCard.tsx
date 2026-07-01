"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  glow?: "purple" | "gold" | "violet";
}

export function StatCard({ label, value, icon, glow = "purple" }: StatCardProps) {
  const glowStyles = {
    purple: "border-purple-500/25 shadow-glow-purple from-purple-950/50",
    gold: "border-amber-400/25 shadow-glow-gold from-amber-950/40",
    violet: "border-violet-400/25 shadow-glow-violet from-violet-950/40",
  };

  const valueClass =
    glow === "gold" ? "reward-value glow-gold" : glow === "violet" ? "game-stat-value text-violet-200 glow-purple" : "game-stat-value text-white";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn("rounded-2xl border p-6 md:p-7 backdrop-blur-xl bg-gradient-to-br to-black/70", glowStyles[glow])}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="game-label">{label}</span>
        {icon && <span className="text-3xl">{icon}</span>}
      </div>
      <p className={valueClass}>{value}</p>
    </motion.div>
  );
}
