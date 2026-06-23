import React from "react";

interface GlowTextProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  variant?: "purple" | "gold" | "white";
  className?: string;
}

/** Gradient glow text for headings */
export function GlowText({
  children,
  as: Tag = "h1",
  variant = "purple",
  className = "",
}: GlowTextProps) {
  const variants = {
    purple: "from-purple-300 via-purple-100 to-purple-400",
    gold: "from-amber-300 via-yellow-200 to-amber-400",
    white: "from-white via-purple-100 to-white",
  };

  return (
    <Tag
      className={`bg-gradient-to-r ${variants[variant]} bg-clip-text font-black text-transparent ${className}`}
    >
      {children}
    </Tag>
  );
}
