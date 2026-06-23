import React from "react";

interface CoinBadgeProps {
  amount: number;
  size?: "sm" | "md" | "lg";
}

/** Animated coin display badge */
export function CoinBadge({ amount, size = "md" }: CoinBadgeProps) {
  const sizes = {
    sm: "text-sm px-2 py-0.5",
    md: "text-base px-3 py-1",
    lg: "text-xl px-4 py-2",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full",
        "bg-gradient-to-r from-amber-500/20 to-yellow-600/20",
        "border border-amber-400/40 text-amber-300 font-bold",
        "animate-pulse-gold",
        sizes[size],
      ].join(" ")}
    >
      <span className="text-amber-400">◈</span>
      {amount.toLocaleString()}
    </span>
  );
}
