"use client";

import { cn } from "@/lib/utils";

interface ArenaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "purple" | "ghost";
  size?: "md" | "lg" | "xl";
}

export function ArenaButton({
  children,
  variant = "gold",
  size = "lg",
  className,
  ...props
}: ArenaButtonProps) {
  const variants = {
    gold: "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black border-amber-300/50 shadow-glow-gold hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] hover:scale-[1.03] active:scale-[0.97]",
    purple: "bg-gradient-to-r from-violet-600 to-purple-700 text-white border-purple-400/40 shadow-glow-purple hover:scale-[1.03] active:scale-[0.97]",
    ghost: "bg-white/5 text-purple-200 border-purple-500/30 hover:bg-purple-900/30",
  };

  const sizes = {
    md: "px-6 py-3 text-sm rounded-xl",
    lg: "px-10 py-4 text-base rounded-xl",
    xl: "px-14 py-5 text-lg md:text-xl rounded-2xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-black uppercase tracking-wider border transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
