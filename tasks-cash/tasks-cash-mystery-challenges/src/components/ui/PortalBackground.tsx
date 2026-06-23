"use client";

import { PARTICLE_POSITIONS } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function PortalBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 70% at 50% 0%, rgba(124, 58, 237, 0.35), transparent 60%),
            radial-gradient(ellipse 60% 50% at 100% 80%, rgba(212, 175, 55, 0.1), transparent),
            radial-gradient(ellipse 50% 40% at 0% 90%, rgba(168, 85, 247, 0.15), transparent),
            #000000
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {PARTICLE_POSITIONS.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-400/40"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 6px rgba(168,85,247,0.5)",
          }}
          animate={{ opacity: [0.2, 0.7, 0.2], y: [0, -20, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

interface AnimatedFogProps {
  className?: string;
}

export function AnimatedFog({ className }: AnimatedFogProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <motion.div
        className="absolute -left-[10%] top-[30%] h-[40vh] w-[70vw] rounded-full bg-purple-600/10 blur-[80px]"
        animate={{ x: [0, 40, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-[5%] top-[60%] h-[35vh] w-[60vw] rounded-full bg-violet-500/10 blur-[90px]"
        animate={{ x: [0, -30, 0], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute left-[20%] top-[10%] h-[30vh] w-[50vw] rounded-full bg-amber-500/5 blur-[100px]"
        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
    </div>
  );
}
