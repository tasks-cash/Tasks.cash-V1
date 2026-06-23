"use client";

import { motion } from "framer-motion";

/** Animated portal ring for hero sections */
export function PortalRing({ className = "" }: { className?: string }) {
  return (
    <motion.div
      className={`portal-ring pointer-events-none ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Floating XP gain popup */
export function XPGainPopup({ amount, show }: { amount: number; show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: -40 }}
      exit={{ opacity: 0 }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 text-2xl font-black text-amber-400 drop-shadow-lg"
    >
      +{amount} XP
    </motion.div>
  );
}

/** Coin sparkle effect wrapper */
export function CoinSparkle({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}
