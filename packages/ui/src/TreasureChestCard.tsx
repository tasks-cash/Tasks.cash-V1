"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ITreasureChestDefinition } from "@tasks-cash/types";
import { GameButton } from "./GameButton";
import { cn } from "./lib/utils";

interface TreasureChestCardProps {
  chest: ITreasureChestDefinition;
  onOpen?: (chestId: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

const TYPE_STYLES: Record<string, string> = {
  hidden: "from-slate-900/60 to-black border-slate-500/30",
  epic: "from-purple-950/60 to-black border-purple-400/40 shadow-glow-purple",
  legendary: "from-amber-950/40 to-black border-amber-400/40 shadow-glow-gold",
  mythic: "from-fuchsia-950/40 to-black border-fuchsia-400/40",
  quantum: "from-cyan-950/40 to-black border-cyan-400/40",
};

/** Animated treasure chest with opening sequence */
export function TreasureChestCard({ chest, onOpen, disabled, className }: TreasureChestCardProps) {
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false);

  async function handleOpen() {
    if (!onOpen || opening || disabled) return;
    setOpening(true);
    await new Promise((r) => setTimeout(r, 1200));
    await onOpen(chest.id);
    setOpened(true);
    setOpening(false);
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className={cn(
        "relative rounded-2xl border p-6 backdrop-blur-xl overflow-hidden bg-gradient-to-br",
        TYPE_STYLES[chest.type] ?? TYPE_STYLES.hidden,
        className
      )}
    >
      <AnimatePresence>
        {opening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/80"
          >
            <motion.span
              className="text-6xl"
              animate={{ scale: [1, 1.3, 0.9, 1.2], rotate: [0, -10, 10, 0] }}
              transition={{ duration: 1.2 }}
            >
              {chest.icon}
            </motion.span>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-amber-400"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(i * 30 * (Math.PI / 180)) * 80,
                  y: Math.sin(i * 30 * (Math.PI / 180)) * 80,
                  opacity: 0,
                }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 text-center">
        <motion.span
          className="text-5xl block mb-3"
          animate={opened ? { y: [0, -10, 0] } : {}}
          transition={{ duration: 2, repeat: opened ? Infinity : 0 }}
        >
          {chest.icon}
        </motion.span>
        <h3 className="text-lg font-black text-white">{chest.name}</h3>
        <p className="text-xs text-purple-300/60 mt-1 mb-3">{chest.description}</p>
        <span className="game-badge-purple text-[10px]">Lv.{chest.requiredLevel}+</span>
        <GameButton
          variant="gold"
          size="sm"
          className="w-full mt-4"
          onClick={handleOpen}
          loading={opening}
          disabled={disabled || opened}
          data-sound="treasure-open"
        >
          {opened ? "Opened" : "Open Treasure"}
        </GameButton>
      </div>
    </motion.div>
  );
}
