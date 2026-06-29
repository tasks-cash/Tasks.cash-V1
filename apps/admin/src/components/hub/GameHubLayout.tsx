"use client";

import { motion } from "framer-motion";
import { ParticleField } from "@tasks-cash/ui";
import { MysteryNavbar } from "@/components/nav/MysteryNavbar";
import { PageTransition } from "./PageTransition";
import { cn } from "@/lib/utils";

interface GameHubLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumb?: string;
  showBack?: boolean;
}

export function GameHubLayout({
  children,
  title,
  subtitle,
  eyebrow,
  breadcrumb,
  showBack = true,
}: GameHubLayoutProps) {
  const isHub = !showBack && !title;

  return (
    <div className="relative min-h-screen min-h-[100vh] w-full max-w-[100vw] overflow-x-hidden">
      <ParticleField count={isHub ? 70 : 50} className="fixed inset-0 z-[2] opacity-30 pointer-events-none" />

      <motion.div
        className="fixed left-1/2 top-[10%] h-[800px] w-[800px] -translate-x-1/2 rounded-full pointer-events-none z-[1]"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 65%)" }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="portal-ring fixed left-1/2 top-[12%] h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none z-[1] animate-portal-spin" />
      <div className="fixed inset-0 mystery-fog pointer-events-none z-[1] opacity-35" aria-hidden />
      <div className="fixed inset-0 mystery-vault-fog cinematic-vignette pointer-events-none z-[1]" aria-hidden />

      <MysteryNavbar />

      <main className="relative z-10 w-full max-w-[100vw] px-4 md:px-8 lg:px-12 xl:px-16 py-8 md:py-10 pb-16">
        <PageTransition>
          {(title || breadcrumb) && (
            <div className="mb-8 md:mb-10">
              {breadcrumb && (
                <p className="text-[10px] uppercase tracking-[0.35em] text-purple-400/40 mb-2">{breadcrumb}</p>
              )}
              {eyebrow && (
                <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/50 font-bold mb-2">{eyebrow}</p>
              )}
              {title && (
                <h1 className={cn("font-black text-white uppercase tracking-tight", "text-3xl md:text-4xl lg:text-5xl")}>
                  {title}
                </h1>
              )}
              {subtitle && <p className="mt-3 text-sm md:text-base text-purple-300/55 max-w-3xl">{subtitle}</p>}
              <div className="portal-divider mt-6 max-w-xs opacity-50" />
            </div>
          )}
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
