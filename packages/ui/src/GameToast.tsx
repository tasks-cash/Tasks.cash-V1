"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ILiveReward } from "@tasks-cash/types";

interface ToastItem extends ILiveReward {
  toastId: string;
}

interface GameToastContextValue {
  toasts: ToastItem[];
  pushToast: (reward: ILiveReward) => void;
  dismissToast: (id: string) => void;
}

const GameToastContext = createContext<GameToastContextValue | null>(null);

const RARITY_BORDER: Record<string, string> = {
  common: "border-slate-400/40",
  rare: "border-blue-400/50",
  epic: "border-purple-400/50 shadow-glow-purple",
  legendary: "border-amber-400/50 shadow-glow-gold",
  mythic: "border-fuchsia-400/50 shadow-[0_0_30px_rgba(232,121,249,0.4)]",
};

function GameToastItem({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const border = RARITY_BORDER[toast.rarity ?? "common"];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-2xl bg-black/80 p-4 min-w-[280px] max-w-sm ${border}`}
      onClick={onDismiss}
      data-sound="toast-reward"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-transparent to-amber-500/10"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="relative flex items-start gap-3">
        <motion.span
          className="text-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {toast.icon}
        </motion.span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-white text-sm">{toast.title}</p>
          <p className="text-purple-300/70 text-xs mt-0.5">{toast.message}</p>
        </div>
      </div>
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-amber-400"
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 5, ease: "linear" }}
      />
    </motion.div>
  );
}

export function GameToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((reward: ILiveReward) => {
    const toastId = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { ...reward, toastId }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== id));
  }, []);

  return (
    <GameToastContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
      <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <GameToastItem key={toast.toastId} toast={toast} onDismiss={() => dismissToast(toast.toastId)} />
          ))}
        </AnimatePresence>
      </div>
    </GameToastContext.Provider>
  );
}

export function useGameToast() {
  const ctx = useContext(GameToastContext);
  if (!ctx) throw new Error("useGameToast must be used within GameToastProvider");
  return ctx;
}
