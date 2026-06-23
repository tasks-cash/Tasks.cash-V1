"use client";

import React from "react";
import type { MysteryMissionCategory } from "@tasks-cash/types";
import { MYSTERY_CATEGORY_LABELS } from "@tasks-cash/types";
import { motion } from "framer-motion";
import { cn } from "./lib/utils";

interface MysteryCategoryTabsProps {
  active: MysteryMissionCategory | "all";
  onChange: (category: MysteryMissionCategory | "all") => void;
  counts?: Partial<Record<MysteryMissionCategory | "all", number>>;
  className?: string;
}

const CATEGORIES: (MysteryMissionCategory | "all")[] = [
  "all",
  "daily",
  "weekly",
  "monthly",
  "special",
  "community",
  "referral",
  "video",
  "social_media",
  "ai",
  "hidden",
  "legendary",
  "founder",
];

/** Scrollable category filter for mystery archive */
export function MysteryCategoryTabs({ active, onChange, counts, className }: MysteryCategoryTabsProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
        {CATEGORIES.map((cat) => {
          const label = cat === "all" ? "All Archives" : MYSTERY_CATEGORY_LABELS[cat];
          const isActive = active === cat;
          return (
            <motion.button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              data-sound="category-tab"
              className={cn(
                "snap-start shrink-0 rounded-xl border px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
                isActive
                  ? "border-amber-400/50 bg-gradient-to-r from-purple-900/60 to-amber-950/30 text-amber-200 shadow-glow-gold"
                  : "border-purple-500/20 bg-black/40 text-purple-400/70 hover:border-purple-400/40 hover:text-purple-200"
              )}
            >
              {label}
              {counts?.[cat] !== undefined && (
                <span className="ml-2 opacity-60">({counts[cat]})</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
