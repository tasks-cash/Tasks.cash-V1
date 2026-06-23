"use client";

import React from "react";
import { motion } from "framer-motion";
import type { ICurrencies, CurrencyType } from "@tasks-cash/types";
import { cn } from "./lib/utils";

const CURRENCY_ICONS: Record<CurrencyType, string> = {
  bronze: "🟤",
  silver: "⚪",
  gold: "🟡",
  diamonds: "💎",
  crystals: "🔮",
  legendTokens: "🏅",
  mythicCoins: "✨",
  portalEnergy: "⚡",
};

const CURRENCY_LABELS: Record<CurrencyType, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamonds: "Diamonds",
  crystals: "Crystals",
  legendTokens: "Legend",
  mythicCoins: "Mythic",
  portalEnergy: "Energy",
};

interface CurrencyWalletProps {
  currencies: ICurrencies;
  compact?: boolean;
  highlight?: CurrencyType;
  className?: string;
}

/** Multi-currency wallet display */
export function CurrencyWallet({ currencies, compact = false, highlight, className }: CurrencyWalletProps) {
  const entries = (Object.keys(currencies) as CurrencyType[]).filter((k) => compact ? currencies[k] > 0 : true);

  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 md:grid-cols-4", className)}>
      {entries.map((key, i) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ scale: 1.03 }}
          className={cn(
            "rounded-xl border p-3 backdrop-blur-xl transition-all",
            highlight === key
              ? "border-amber-400/40 bg-amber-950/20 shadow-glow-gold"
              : "border-purple-500/20 bg-black/40 hover:border-purple-400/40"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <span>{CURRENCY_ICONS[key]}</span>
            <span className="text-[10px] uppercase tracking-wider text-purple-400/60">{CURRENCY_LABELS[key]}</span>
          </div>
          <motion.p
            key={currencies[key]}
            initial={{ scale: 1.2, color: "#fbbf24" }}
            animate={{ scale: 1, color: key === "gold" || key === "mythicCoins" ? "#fbbf24" : "#fff" }}
            className="text-lg font-black tabular-nums"
          >
            {currencies[key].toLocaleString()}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
}
