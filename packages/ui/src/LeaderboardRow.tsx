import React from "react";

interface LeaderboardRowProps {
  rank: number;
  username: string;
  level: number;
  coins: number;
  xp: number;
  isCurrentUser?: boolean;
}

/** Single leaderboard entry row */
export function LeaderboardRow({
  rank,
  username,
  level,
  coins,
  xp,
  isCurrentUser = false,
}: LeaderboardRowProps) {
  const rankColors: Record<number, string> = {
    1: "text-amber-400",
    2: "text-gray-300",
    3: "text-orange-400",
  };

  return (
    <div
      className={[
        "flex items-center gap-4 rounded-xl px-4 py-3 transition-all",
        isCurrentUser
          ? "bg-purple-600/20 border border-purple-400/40"
          : "hover:bg-white/5",
      ].join(" ")}
    >
      <span className={`w-8 text-center text-lg font-black ${rankColors[rank] ?? "text-purple-400/60"}`}>
        {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-white truncate">{username}</p>
        <p className="text-xs text-purple-400/60">Level {level}</p>
      </div>
      <div className="text-right text-sm">
        <p className="text-amber-400 font-bold">◈ {coins.toLocaleString()}</p>
        <p className="text-purple-300/60">{xp.toLocaleString()} XP</p>
      </div>
    </div>
  );
}
