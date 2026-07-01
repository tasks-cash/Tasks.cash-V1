"use client";

import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, PortalButton } from "@tasks-cash/ui";

interface DnaQuestionRewards {
  xp?: number;
  coins?: number;
  badges?: string[];
}

function formatDnaRewardPreview(rewards: DnaQuestionRewards): string[] {
  const lines: string[] = [];
  if (rewards.xp) lines.push(`+${rewards.xp} XP`);
  if (rewards.coins) lines.push(`+${rewards.coins} Coins`);
  if (rewards.badges?.length) lines.push(...rewards.badges.map((b) => `🏅 ${b}`));
  return lines.length ? lines : ["DNA intelligence increased"];
}

interface DnaRewardPopupProps {
  open: boolean;
  rewards: DnaQuestionRewards | null;
  onClose: () => void;
}

export function DnaRewardPopup({ open, rewards, onClose }: DnaRewardPopupProps) {
  const lines = rewards ? formatDnaRewardPreview(rewards) : [];

  return (
    <AnimatePresence>
      {open && rewards && (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close reward popup"
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <GlassCard glow="gold" className="pointer-events-auto w-full max-w-md p-8 border-amber-400/35 text-center">
              <p className="text-[10px] uppercase tracking-[0.35em] text-purple-400/50 font-bold mb-2">Explorer DNA</p>
              <h3 className="text-2xl md:text-3xl font-black text-white mb-4">DNA Answer Saved</h3>
              <div className="space-y-2 mb-6">
                {lines.map((line) => (
                  <p key={line} className="text-lg font-bold text-amber-300">{line}</p>
                ))}
              </div>
              <p className="text-sm text-purple-300/55 mb-6">Rewards added to your wallet. Mission recommendations updated.</p>
              <PortalButton variant="gold" className="w-full" onClick={onClose}>
                Continue Exploring
              </PortalButton>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
