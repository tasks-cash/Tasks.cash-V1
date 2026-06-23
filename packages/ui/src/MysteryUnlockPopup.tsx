"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IMysteryMissionView } from "@tasks-cash/types";
import { MYSTERY_CATEGORY_LABELS } from "@tasks-cash/types";
import { BrandLogo } from "./BrandLogo";
import { PortalButton } from "./PortalButton";
import { ParticleField } from "./ParticleField";
import { MysteryMissionCard } from "./MysteryMissionCard";

interface MysteryUnlockPopupProps {
  mission: IMysteryMissionView | null;
  open: boolean;
  onClose: () => void;
  onStart?: (mission: IMysteryMissionView) => void;
}

/** Epic "NEW MISSION DISCOVERED" popup */
export function MysteryUnlockPopup({ mission, open, onClose, onStart }: MysteryUnlockPopupProps) {
  return (
    <AnimatePresence>
      {open && mission && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />
          <ParticleField count={80} className="z-[1]" />

          <motion.div
            className="relative z-10 w-full max-w-lg"
            initial={{ scale: 0.7, opacity: 0, rotateX: 20 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="portal-ring absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 opacity-30 animate-portal-spin pointer-events-none" />

            <motion.div
              className="text-center mb-6"
              animate={{ filter: ["drop-shadow(0 0 20px rgba(168,85,247,0.5))", "drop-shadow(0 0 40px rgba(251,191,36,0.6))", "drop-shadow(0 0 20px rgba(168,85,247,0.5))"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BrandLogo size="sm" href={null} animated={false} className="mx-auto mb-4" />
              <motion.p
                className="text-xs uppercase tracking-[0.5em] text-amber-400 font-black mb-2"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ◈ Portal Alert ◈
              </motion.p>
              <h2 className="text-2xl md:text-3xl font-black text-white font-[family-name:var(--font-cinzel)]">
                NEW MISSION DISCOVERED
              </h2>
              <p className="text-purple-300/60 text-sm mt-2">
                {MYSTERY_CATEGORY_LABELS[mission.category]} · {mission.difficulty}
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MysteryMissionCard mission={{ ...mission, isRevealed: true, playerState: "unlocked" }} />
            </motion.div>

            <div className="flex gap-3 mt-6">
              <PortalButton
                variant="gold"
                className="flex-1"
                pulse
                onClick={() => { onStart?.(mission); onClose(); }}
                data-sound="mission-discovered"
              >
                Accept Mission
              </PortalButton>
              <PortalButton variant="secondary" className="flex-1" onClick={onClose}>
                Later
              </PortalButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
