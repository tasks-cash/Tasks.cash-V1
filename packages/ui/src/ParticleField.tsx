"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ParticleFieldProps {
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

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i * 19 + 11) % 100,
    y: (i * 29 + 5) % 100,
    size: 1 + (i % 4),
    duration: 6 + (i % 8),
    delay: (i % 5) * 0.4,
    color:
      i % 3 === 0
        ? "rgba(251,191,36,0.6)"
        : i % 3 === 1
          ? "rgba(168,85,247,0.5)"
          : "rgba(124,58,237,0.4)",
  }));
}

/** Floating particle loop — client-only to avoid hydration mismatch */
export function ParticleField({ count = 40, className = "" }: ParticleFieldProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(createParticles(count));
  }, [count]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.sin(p.id) * 15, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
