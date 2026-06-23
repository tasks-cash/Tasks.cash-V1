"use client";

import { motion } from "framer-motion";
import { GlowText } from "@tasks-cash/ui";
import { cn } from "@tasks-cash/ui";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  variant?: "purple" | "gold" | "white";
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  variant = "purple",
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "mb-14 md:mb-20",
        align === "center" ? "text-center mx-auto max-w-3xl" : "text-left max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-4 text-xs sm:text-sm uppercase tracking-[0.35em] text-purple-400/70 animate-pulse">
          ◈ {eyebrow} ◈
        </p>
      )}
      <GlowText
        as="h2"
        variant={variant}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight mb-4 font-[family-name:var(--font-cinzel)]"
      >
        {title}
      </GlowText>
      {subtitle && (
        <p className="text-base md:text-lg text-purple-200/55 leading-relaxed">{subtitle}</p>
      )}
      <div
        className={cn(
          "mt-8 h-px w-24 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent",
          align === "center" && "mx-auto",
        )}
      />
    </motion.div>
  );
}
