"use client";

import React from "react";
import { cn } from "./lib/utils";

interface GameButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "purple" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  pulse?: boolean;
  soundId?: string;
}

const variants = {
  gold: [
    "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600",
    "hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500",
    "text-black font-black border border-amber-300/50",
    "shadow-glow-gold hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]",
  ].join(" "),
  purple: [
    "bg-gradient-to-r from-violet-600 via-purple-600 to-violet-700",
    "hover:from-violet-500 hover:via-purple-500 hover:to-violet-600",
    "text-white border border-purple-400/40",
    "shadow-glow-purple hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]",
  ].join(" "),
  secondary: [
    "bg-white/5 hover:bg-purple-900/30",
    "text-purple-100 border border-purple-500/30",
    "hover:border-violet-400/50 hover:shadow-glow-purple",
  ].join(" "),
  ghost: "bg-transparent hover:bg-purple-900/30 text-purple-300 border border-transparent",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-8 py-3.5 text-lg rounded-xl",
};

/** Premium AAA game-style CTA button with glowing border + sound-ready data attr */
export function GameButton({
  children,
  variant = "purple",
  size = "md",
  loading = false,
  pulse = false,
  soundId,
  className,
  disabled,
  ...props
}: GameButtonProps) {
  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-semibold overflow-hidden",
        "transition-all duration-300 active:scale-[0.97] hover:scale-[1.02]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60",
        "hover-sound-ready",
        "before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300",
        "hover:before:opacity-100",
        variant === "gold" && "before:bg-gradient-to-r before:from-amber-400/20 before:to-yellow-400/10",
        variant === "purple" && "before:bg-gradient-to-r before:from-violet-500/20 before:to-purple-500/10",
        pulse && "animate-pulse-gold",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      data-sound={soundId ?? `btn-${variant}`}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </span>
    </button>
  );
}
