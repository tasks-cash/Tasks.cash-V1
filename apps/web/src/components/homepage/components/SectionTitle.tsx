"use client";

import { motion } from "framer-motion";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionTitle({ eyebrow, title, subtitle, align = "center" }: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-12 md:mb-16 max-w-4xl ${alignClass}`}
    >
      {eyebrow && (
        <p className="mb-4 text-[10px] md:text-xs uppercase tracking-[0.45em] text-violet-400/80 font-[family-name:var(--font-orbitron)] font-bold">
          ◈ {eyebrow} ◈
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-[family-name:var(--font-cinzel)] leading-tight hp-title-glow">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base md:text-lg text-purple-200/50 font-[family-name:var(--font-inter)] leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="portal-divider mt-8 max-w-xs mx-auto" />
    </motion.div>
  );
}
