"use client";

import React from "react";
import { motion } from "framer-motion";

interface PortalBackgroundProps {
  className?: string;
  intensity?: "subtle" | "medium" | "cinematic";
}

/** Animated cosmic portal background layers */
export function PortalBackground({ className = "", intensity = "medium" }: PortalBackgroundProps) {
  const opacity = intensity === "subtle" ? 0.15 : intensity === "cinematic" ? 0.45 : 0.3;

  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124, 58, 237, ${opacity}), transparent),
            radial-gradient(ellipse 50% 40% at 85% 70%, rgba(212, 175, 55, ${opacity * 0.3}), transparent),
            radial-gradient(ellipse 40% 35% at 10% 85%, rgba(168, 85, 247, ${opacity * 0.5}), transparent),
            radial-gradient(ellipse 30% 25% at 70% 20%, rgba(59, 130, 246, ${opacity * 0.15}), transparent),
            #000000
          `,
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-0 top-0 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "rgba(168, 85, 247, 0.08)" }}
        animate={{ x: [0, -30, 0], y: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 game-grid-bg opacity-40" />
    </div>
  );
}
