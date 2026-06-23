import React from "react";
import type { MissionDifficulty } from "@tasks-cash/types";

interface MissionCardProps {
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  coinReward: number;
  xpReward: number;
  category: string;
  onComplete?: () => void;
  completed?: boolean;
  loading?: boolean;
}

const DIFFICULTY_STYLES: Record<MissionDifficulty, string> = {
  easy: "text-green-400 bg-green-400/10 border-green-400/30",
  medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  hard: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  epic: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  legendary: "text-amber-400 bg-amber-400/10 border-amber-400/30 animate-pulse",
};

/** Mission card with difficulty badge and rewards */
export function MissionCard({
  title,
  description,
  difficulty,
  coinReward,
  xpReward,
  category,
  onComplete,
  completed = false,
  loading = false,
}: MissionCardProps) {
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-950/50 to-black/70 p-5 backdrop-blur-xl transition-all hover:border-purple-400/40">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <span className="text-xs uppercase tracking-widest text-purple-400/60">{category}</span>
          <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-bold uppercase ${DIFFICULTY_STYLES[difficulty]}`}
        >
          {difficulty}
        </span>
      </div>
      <p className="mb-4 text-sm text-purple-200/70 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="text-amber-400 font-bold">◈ {coinReward}</span>
          <span className="text-purple-300">⚡ {xpReward} XP</span>
        </div>
        {onComplete && (
          <button
            onClick={onComplete}
            disabled={completed || loading}
            className={[
              "rounded-lg px-4 py-1.5 text-sm font-semibold transition-all",
              completed
                ? "bg-green-500/20 text-green-400 border border-green-400/30"
                : "bg-purple-600 hover:bg-purple-500 text-white",
              loading ? "opacity-50 cursor-wait" : "",
            ].join(" ")}
          >
            {completed ? "✓ Done" : loading ? "..." : "Complete"}
          </button>
        )}
      </div>
    </div>
  );
}
