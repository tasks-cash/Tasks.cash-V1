"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@tasks-cash/ui";

interface CinematicSectionProps {
  id?: string;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  parallax?: boolean;
  glow?: "purple" | "gold" | "none";
  fullWidth?: boolean;
}

export function CinematicSection({
  id,
  children,
  className,
  innerClassName,
  parallax = false,
  glow = "none",
  fullWidth = true,
}: CinematicSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], parallax ? [40, -40] : [0, 0]);

  const glowClass =
    glow === "purple"
      ? "homepage-section-glow-purple"
      : glow === "gold"
        ? "homepage-section-glow-gold"
        : "";

  return (
    <section
      id={id}
      ref={ref}
      className={cn("relative w-full overflow-hidden py-20 md:py-28 lg:py-36", glowClass, className)}
    >
      <motion.div
        style={parallax ? { y } : undefined}
        className={cn(
          "relative z-10 w-full",
          fullWidth ? "px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20" : "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
          innerClassName
        )}
      >
        {children}
      </motion.div>
    </section>
  );
}
