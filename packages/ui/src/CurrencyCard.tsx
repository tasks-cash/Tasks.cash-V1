"use client";

import React from "react";
import { motion } from "framer-motion";
import type { CurrencyType } from "@tasks-cash/types";
import { cn } from "./lib/utils";

export interface CurrencyHistoryEntry {
  label: string;
  amount: number;
  time: string;
}

const CURRENCY_CONFIG: Record<
  CurrencyType,
  { label: string; icon: string; glow: string; border: string; bg: string }
> = {
  bronze: {
    label: "Bronze Coins",
    icon: "🟤",
    glow: "shadow-[0_0_20px_rgba(205,127,50,0.35)]",
    border: "border-amber-700/40",
    bg: "from-amber-950/40 to-black/70",
  },
  silver: {
    label: "Silver Coins",
    icon: "⚪",
    glow: "shadow-[0_0_20px_rgba(192,192,192,0.25)]",
    border: "border-slate-400/30",
    bg: "from-slate-900/50 to-black/70",
  },
  gold: {
    label: "Gold Coins",
    icon: "🟡",
    glow: "shadow-glow-gold",
    border: "border-amber-400/40",
    bg: "from-amber-950/50 to-black/70",
  },
  diamonds: {
    label: "Diamond Gems",
    icon: "💎",
    glow: "shadow-[0_0_22px_rgba(96,165,250,0.35)]",
    border: "border-blue-400/35",
    bg: "from-blue-950/40 to-black/70",
  },
  crystals: {
    label: "Crystal Shards",
    icon: "🔮",
    glow: "shadow-[0_0_22px_rgba(168,85,247,0.35)]",
    border: "border-violet-400/35",
    bg: "from-violet-950/40 to-black/70",
  },
  legendTokens: {
    label: "Legend Tokens",
    icon: "🏅",
    glow: "shadow-glow-gold",
    border: "border-orange-400/30",
    bg: "from-orange-950/30 to-black/70",
  },
  mythicCoins: {
    label: "Mythic Coins",
    icon: "✨",
    glow: "shadow-[0_0_22px_rgba(232,121,249,0.35)]",
    border: "border-fuchsia-400/30",
    bg: "from-fuchsia-950/30 to-black/70",
  },
  portalEnergy: {
    label: "Portal Energy",
    icon: "⚡",
    glow: "shadow-glow-purple",
    border: "border-purple-400/35",
    bg: "from-purple-950/40 to-black/70",
  },
};

interface CurrencyCardProps {
  type: CurrencyType;
  balance: number;
  history?: CurrencyHistoryEntry[];
  className?: string;
}

/** Premium currency card with glow, animation, and history preview */
export function CurrencyCard({ type, balance, history = [], className }: CurrencyCardProps) {
  const config = CURRENCY_CONFIG[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className={cn(
        "relative rounded-2xl border backdrop-blur-xl overflow-hidden",
        "bg-gradient-to-br",
        config.bg,
        config.border,
        config.glow,
        "hover:border-opacity-80 transition-all duration-300",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />
      <motion.div
        className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20 blur-2xl"
        style={{ background: type === "gold" ? "#fbbf24" : type === "diamonds" ? "#60a5fa" : "#a855f7" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.span
              className="text-2xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              {config.icon}
            </motion.span>
            <span className="text-[10px] uppercase tracking-wider text-purple-300/70 font-semibold">
              {config.label}
            </span>
          </div>
        </div>

        <motion.p
          key={balance}
          initial={{ scale: 1.15, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            "text-2xl md:text-3xl font-black tabular-nums mb-3",
            type === "gold" ? "text-amber-400" : "text-white"
          )}
        >
          {balance.toLocaleString()}
        </motion.p>

        {history.length > 0 && (
          <div className="border-t border-white/5 pt-3 space-y-1.5">
            <p className="text-[9px] uppercase tracking-widest text-purple-400/40 mb-1">Recent</p>
            {history.slice(0, 2).map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <span className="text-purple-300/50 truncate max-w-[60%]">{entry.label}</span>
                <span className={entry.amount >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {entry.amount >= 0 ? "+" : ""}
                  {entry.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Grid of primary dashboard currencies */
export function CurrencyCardGrid({
  currencies,
  historyMap,
  types = ["bronze", "silver", "gold", "diamonds", "crystals"],
  className,
}: {
  currencies: Record<CurrencyType, number>;
  historyMap?: Partial<Record<CurrencyType, CurrencyHistoryEntry[]>>;
  types?: CurrencyType[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4", className)}>
      {types.map((type, i) => (
        <motion.div
          key={type}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
        >
          <CurrencyCard
            type={type}
            balance={currencies[type] ?? 0}
            history={historyMap?.[type]}
          />
        </motion.div>
      ))}
    </div>
  );
}
