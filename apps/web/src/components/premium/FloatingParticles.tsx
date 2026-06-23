"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i * 17 + 13) % 100,
    y: (i * 23 + 7) % 100,
    size: 1 + (i % 4),
    duration: 6 + (i % 8),
    delay: (i % 5) * 0.4,
    color: i % 3 === 0 ? "bg-amber-400/40" : "bg-purple-400/30",
  }));
}

/** Ambient floating particles — client-only to avoid hydration mismatch */
export function FloatingParticles({ count = 40, className = "" }: FloatingParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(buildParticles(count));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`absolute rounded-full ${p.color}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
