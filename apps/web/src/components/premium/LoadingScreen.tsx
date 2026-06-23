"use client";

import { motion } from "framer-motion";
import { BrandLogo, ParticleField } from "@tasks-cash/ui";

/** Cinematic portal loading screen with official logo */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      <ParticleField count={60} />
      <div className="portal-ring absolute h-72 w-72 opacity-25 animate-portal-spin" />
      <motion.div
        className="absolute h-64 w-64 rounded-full bg-purple-600/10 blur-[100px]"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{
            filter: [
              "drop-shadow(0 0 15px rgba(124,58,237,0.5))",
              "drop-shadow(0 0 35px rgba(168,85,247,0.8))",
              "drop-shadow(0 0 15px rgba(124,58,237,0.5))",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <BrandLogo size="xl" href={undefined} showTagline animated={false} />
        </motion.div>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-gradient-to-r from-purple-500 to-amber-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-[0.5em] text-purple-400/50">Opening Portal...</p>
      </motion.div>
    </div>
  );
}
