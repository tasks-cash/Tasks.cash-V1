"use client";

import React from "react";
import { motion } from "framer-motion";
import { GlowText } from "./GlowText";
import { cn } from "./lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
  showDivider?: boolean;
}

/** Cinematic page header with portal divider */
export function PageHeader({ title, subtitle, badge, className, children, showDivider = true }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative mb-10 pb-8", className)}
    >
      {badge && (
        <motion.span
          className="inline-block mb-4 rounded-full border border-purple-500/30 bg-purple-950/40 px-4 py-1 text-[10px] uppercase tracking-[0.3em] text-violet-300/80"
          animate={{ boxShadow: ["0 0 5px rgba(124,58,237,0.2)", "0 0 15px rgba(168,85,247,0.4)", "0 0 5px rgba(124,58,237,0.2)"] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {badge}
        </motion.span>
      )}
      <GlowText as="h1" variant="gold" className="text-3xl md:text-4xl lg:text-5xl font-[family-name:var(--font-cinzel)]">
        {title}
      </GlowText>
      {subtitle && <p className="mt-3 max-w-2xl text-purple-200/60 text-base md:text-lg">{subtitle}</p>}
      {children}
      {showDivider && <div className="portal-divider mt-8" />}
    </motion.header>
  );
}
