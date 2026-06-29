"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  currentLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  glow?: "purple" | "gold" | "violet";
}

export function AnimatedProgressBar({
  value,
  max = 100,
  label,
  currentLabel,
  size = "md",
  className,
  glow = "purple",
}: AnimatedProgressBarProps) {
  const pct = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : value));

  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  const fillClass =
    glow === "gold"
      ? "from-amber-600 via-yellow-500 to-amber-400"
      : glow === "violet"
        ? "from-violet-600 via-purple-500 to-violet-400"
        : "from-violet-600 via-purple-500 to-amber-400";

  return (
    <div className={cn("w-full", className)}>
      {(label || currentLabel) && (
        <div className="flex justify-between items-center mb-2 gap-3">
          {label && <span className="text-[10px] uppercase tracking-[0.2em] text-purple-400/55 font-bold">{label}</span>}
          {currentLabel && <span className="text-[10px] uppercase tracking-wider text-purple-400/50 tabular-nums">{currentLabel}</span>}
        </div>
      )}
      <div className={cn("prog-bar-track rounded-full overflow-hidden border border-purple-500/25 bg-black/60", heights[size])}>
        <motion.div
          className={cn("prog-bar-fill h-full rounded-full bg-gradient-to-r", fillClass)}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
