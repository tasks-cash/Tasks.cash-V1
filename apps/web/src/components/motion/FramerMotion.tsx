"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function FramerPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children as ReactNode}
    </motion.div>
  );
}

export function PortalOrb({ className }: { className?: string }) {
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -20, 0], opacity: [0.15, 0.25, 0.15] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
