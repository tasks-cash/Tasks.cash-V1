"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "./lib/utils";

export type ActivityType =
  | "mission_completed"
  | "level_up"
  | "treasure_opened"
  | "reward_claimed"
  | "challenge_joined";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  time: string;
  icon?: string;
}

const ACTIVITY_META: Record<ActivityType, { icon: string; color: string }> = {
  mission_completed: { icon: "⚔️", color: "text-purple-300" },
  level_up: { icon: "⬆️", color: "text-amber-400" },
  treasure_opened: { icon: "🎁", color: "text-violet-300" },
  reward_claimed: { icon: "◈", color: "text-emerald-400" },
  challenge_joined: { icon: "🏟️", color: "text-cyan-300" },
};

interface PlayerActivityFeedProps {
  title?: string;
  activities: ActivityEntry[];
  className?: string;
}

/** Game-like player activity timeline */
export function PlayerActivityFeed({ title = "Recent Activity", activities, className }: PlayerActivityFeedProps) {
  return (
    <div className={cn("rounded-2xl border border-purple-500/20 bg-gradient-to-br from-black/60 to-purple-950/20 backdrop-blur-xl p-6", className)}>
      <h3 className="text-lg font-black text-white mb-5 font-[family-name:var(--font-cinzel)]">{title}</h3>
      <div className="space-y-3">
        {activities.map((activity, i) => {
          const meta = ACTIVITY_META[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 rounded-xl border border-purple-500/10 bg-black/40 px-4 py-3 hover:border-purple-400/30 transition-colors"
            >
              <motion.span
                className="text-xl shrink-0 mt-0.5"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >
                {activity.icon ?? meta.icon}
              </motion.span>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", meta.color)}>{activity.title}</p>
                {activity.detail && <p className="text-xs text-purple-400/50 mt-0.5">{activity.detail}</p>}
              </div>
              <span className="text-[10px] text-purple-500/40 shrink-0 uppercase tracking-wider">{activity.time}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
