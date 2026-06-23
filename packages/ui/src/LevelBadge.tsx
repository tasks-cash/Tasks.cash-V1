"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./lib/utils";

interface LevelBadgeProps {
  level: number;
  title?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  sm: { ring: "h-12 w-12 text-sm", title: "text-xs" },
  md: { ring: "h-16 w-16 text-lg", title: "text-sm" },
  lg: { ring: "h-24 w-24 text-2xl", title: "text-base" },
};

/** Game-style level badge with metallic gold ring */
export function LevelBadge({ level, title, size = "md", className }: LevelBadgeProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <motion.div
        animate={{ boxShadow: ["0 0 10px rgba(251,191,36,0.3)", "0 0 25px rgba(168,85,247,0.4)", "0 0 10px rgba(251,191,36,0.3)"] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        className={cn(
          "relative flex items-center justify-center rounded-full",
          "border-2 border-amber-400/60 bg-gradient-to-br from-purple-950/80 to-black",
          s.ring
        )}
      >
        <span className="font-black bg-gradient-to-b from-amber-200 to-amber-500 bg-clip-text text-transparent">
          {level}
        </span>
        <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-portal-spin opacity-30" />
      </motion.div>
      {title && (
        <p className={cn("font-bold text-purple-200/80 uppercase tracking-wider text-center", s.title)}>
          {title}
        </p>
      )}
    </div>
  );
}
