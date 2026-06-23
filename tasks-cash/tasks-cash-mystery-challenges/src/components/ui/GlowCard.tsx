"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "purple" | "gold" | "violet";
  hover?: boolean;
}

export function GlowCard({ children, className, glow = "purple", hover = true }: GlowCardProps) {
  const glowClass =
    glow === "gold" ? "glow-card-gold" : glow === "violet" ? "glow-card-violet" : "glow-card-purple";

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={cn(glowClass, className)}
      >
        {children}
      </motion.div>
    );
  }

  return <div className={cn(glowClass, className)}>{children}</div>;
}

interface SectionShellProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  minHeight?: boolean;
}

export function SectionShell({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className,
  minHeight = true,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn("arena-section flex flex-col justify-center", minHeight && "min-h-screen", className)}
    >
      <div className="arena-section-inner w-full">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {eyebrow && <p className="arena-subheading mb-4">{eyebrow}</p>}
          <h2 className="arena-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3">{title}</h2>
          {subtitle && (
            <p className="text-purple-200/55 text-base md:text-lg lg:text-xl max-w-4xl mb-8 leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="portal-divider max-w-2xl" />
        </motion.div>
        <div className="mt-8 md:mt-12">{children}</div>
      </div>
    </section>
  );
}
