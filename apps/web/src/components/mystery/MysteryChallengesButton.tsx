"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/constants";

/** Global authenticated header entry — Mystery Mode & Challenges */
export function MysteryChallengesButton() {
  return (
    <Link
      href={ROUTES.mysteryChallenges}
      className="hover-sound-ready shrink-0"
      data-sound="mystery-challenges"
    >
      <motion.div
        whileHover={{ scale: 1.04, y: -1 }}
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-r from-violet-700 via-purple-700 to-amber-600/90 px-3 py-2 md:px-4 md:py-2.5 shadow-glow-purple animate-neon-pulse"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        />
        <motion.span
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 8px rgba(168,85,247,0.4)",
              "0 0 22px rgba(251,191,36,0.5)",
              "0 0 8px rgba(168,85,247,0.4)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <span className="relative z-10 flex items-center gap-2 text-xs md:text-sm font-bold text-white whitespace-nowrap">
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="text-amber-200 text-base"
            aria-hidden
          >
            ◈
          </motion.span>
          <span className="hidden sm:inline font-[family-name:var(--font-cinzel)]" dir="rtl">
            الوضع الغامض والتحديات
          </span>
          <span className="hidden lg:inline text-amber-100/90">· Mystery Mode & Challenges</span>
          <span className="sm:hidden">Mystery</span>
        </span>
      </motion.div>
    </Link>
  );
}
