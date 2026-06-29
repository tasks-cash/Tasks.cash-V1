"use client";

import { motion } from "framer-motion";

export function DnaHelixBackground() {
  return (
    <div className="dna-helix-bg pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
      <motion.div
        className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.12]"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <svg viewBox="0 0 400 400" className="h-full w-full">
          <defs>
            <linearGradient id="dnaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <ellipse
              key={i}
              cx={200 + Math.sin(i * 0.8) * 80}
              cy={40 + i * 45}
              rx="12"
              ry="6"
              fill="none"
              stroke="url(#dnaGrad)"
              strokeWidth="2"
              opacity={0.4 + (i % 3) * 0.15}
              transform={`rotate(${i * 22} ${200 + Math.sin(i * 0.8) * 80} ${40 + i * 45})`}
            />
          ))}
        </svg>
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
    </div>
  );
}
