"use client";

import React from "react";
import { motion } from "framer-motion";
import { BRAND } from "./brand/constants";
import { cn } from "./lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "hero";
  href?: string | null;
  animated?: boolean;
  showTagline?: boolean;
  priority?: boolean;
}

const SIZE_MAP = {
  xs: { img: "h-8", wrap: "gap-1" },
  sm: { img: "h-10", wrap: "gap-1.5" },
  md: { img: "h-14", wrap: "gap-2" },
  lg: { img: "h-20", wrap: "gap-2" },
  xl: { img: "h-28", wrap: "gap-3" },
  hero: { img: "h-36 md:h-44 lg:h-52", wrap: "gap-4" },
} as const;

/** Official Tasks.cash logo — always use main_logo.png */
export function BrandLogo({
  className,
  imageClassName,
  size = "md",
  href = "/",
  animated = true,
  showTagline = false,
}: BrandLogoProps) {
  const sizes = SIZE_MAP[size];

  const content = (
    <div className={cn("flex flex-col items-center", sizes.wrap, className)}>
      <motion.div
        className="relative"
        animate={animated ? { filter: ["drop-shadow(0 0 8px rgba(124,58,237,0.4))", "drop-shadow(0 0 20px rgba(168,85,247,0.6))", "drop-shadow(0 0 8px rgba(124,58,237,0.4))"] } : undefined}
        transition={animated ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND.logo}
          alt={BRAND.name}
          className={cn("w-auto object-contain select-none", sizes.img, imageClassName)}
          draggable={false}
        />
      </motion.div>
      {showTagline && (
        <p className="text-[10px] uppercase tracking-[0.35em] text-amber-400/70 font-semibold">
          {BRAND.tagline}
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 rounded-lg">
        {content}
      </a>
    );
  }

  return content;
}
