"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@tasks-cash/ui";

/** Placeholder canvas for future React Three Fiber / Three.js portal integration */
export function Portal3DPlaceholder() {
  return (
    <GlassCard
      glow="purple"
      hover={false}
      className="relative aspect-square w-full max-w-xl mx-auto overflow-hidden border-2 border-purple-500/30"
    >
      {/* R3F mount point — replace inner content with <Canvas> from @react-three/fiber */}
      <div
        data-three-portal="integration-ready"
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        {/* Simulated 3D portal rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-purple-400/30"
              style={{
                width: `${100 - i * 18}%`,
                height: `${100 - i * 18}%`,
                borderColor: i % 2 === 0 ? "rgba(124,58,237,0.4)" : "rgba(251,191,36,0.2)",
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, scale: [1, 1.02, 1] }}
              transition={{
                rotate: { duration: 15 + i * 5, repeat: Infinity, ease: "linear" },
                scale: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
              }}
            />
          ))}
        </div>

        {/* Core glow */}
        <motion.div
          className="relative z-10 h-32 w-32 rounded-full bg-gradient-radial from-purple-400/40 via-purple-600/20 to-transparent blur-sm"
          animate={{
            boxShadow: [
              "0 0 60px rgba(124,58,237,0.6), 0 0 120px rgba(124,58,237,0.3)",
              "0 0 80px rgba(251,191,36,0.4), 0 0 140px rgba(124,58,237,0.4)",
              "0 0 60px rgba(124,58,237,0.6), 0 0 120px rgba(124,58,237,0.3)",
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Center orb */}
        <motion.div
          className="absolute z-20 h-16 w-16 rounded-full bg-gradient-to-br from-amber-300 via-purple-400 to-purple-700 shadow-glow-gold"
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Integration label */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/50">
            Three.js · React Three Fiber
          </p>
          <p className="mt-1 text-xs text-purple-300/40">Portal Canvas Ready</p>
        </div>
      </div>

      {/* Corner HUD markers */}
      {["top-left", "top-right", "bottom-left", "bottom-right"].map((corner) => (
        <div
          key={corner}
          className={`homepage-hud-corner homepage-hud-${corner} absolute h-8 w-8 border-purple-500/40`}
        />
      ))}
    </GlassCard>
  );
}
