import React from "react";

interface LevelBarProps {
  level: number;
  progress: number;
  title?: string;
  xpCurrent?: number;
  xpRequired?: number;
}

/** XP progress bar with level indicator */
export function LevelBar({
  level,
  progress,
  title,
  xpCurrent,
  xpRequired,
}: LevelBarProps) {
  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-bold text-purple-300">
          LVL {level}
          {title && <span className="ml-2 text-purple-400/70 font-normal">· {title}</span>}
        </span>
        {xpCurrent !== undefined && xpRequired !== undefined && (
          <span className="text-purple-400/60">
            {xpCurrent.toLocaleString()} / {xpRequired.toLocaleString()} XP
          </span>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-purple-950/80 border border-purple-500/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-amber-400 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}
