"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { IPlayerProfile } from "@tasks-cash/types";
import { BrandLogo } from "./BrandLogo";
import { LevelBadge } from "./LevelBadge";
import { CurrencyWallet } from "./CurrencyWallet";
import { cn } from "./lib/utils";

interface ProfileCardProps {
  profile: IPlayerProfile;
  className?: string;
}

/** Full player profile card */
export function ProfileCard({ profile, className }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-950/30 via-black/60 to-black/80 backdrop-blur-2xl p-6",
        className
      )}
    >
      <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-2xl border-2 border-amber-400/50 bg-black/60 flex items-center justify-center text-5xl overflow-hidden">
            {profile.avatar ?? "⚔️"}
          </div>
          <span className="absolute -bottom-2 -right-2 game-badge-gold text-[8px]">{profile.avatarFrame}</span>
        </div>
        <div className="text-center md:text-left flex-1">
          <h2 className="text-2xl font-black text-white font-[family-name:var(--font-cinzel)]">{profile.username}</h2>
          <p className="text-amber-400 text-sm font-semibold">{profile.playerTitle}</p>
          <p className="text-purple-400/60 text-xs uppercase tracking-widest mt-1">{profile.explorerRank}</p>
        </div>
        <LevelBadge level={profile.globalLevel} title="Global" size="md" />
      </div>
      <CurrencyWallet currencies={profile.currencies} compact />
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-purple-500/15">
        <div className="text-center">
          <p className="text-xl font-black text-white">{profile.statistics.missionsCompleted}</p>
          <p className="text-[10px] text-purple-400/50 uppercase">Missions</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-amber-400">#{profile.statistics.globalRank}</p>
          <p className="text-[10px] text-purple-400/50 uppercase">Rank</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-black text-purple-300">{profile.statistics.achievementsUnlocked}</p>
          <p className="text-[10px] text-purple-400/50 uppercase">Achievements</p>
        </div>
      </div>
    </motion.div>
  );
}

interface LevelUpOverlayProps {
  show: boolean;
  level: number;
  title?: string;
  onClose?: () => void;
}

export function LevelUpOverlay({ show, level, title, onClose }: LevelUpOverlayProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.p
              className="text-sm uppercase tracking-[0.5em] text-purple-400 mb-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Level Up
            </motion.p>
            <motion.p
              className="text-8xl md:text-9xl font-black bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {level}
            </motion.p>
            {title && <p className="text-xl text-purple-200 mt-4 font-[family-name:var(--font-cinzel)]">{title}</p>}
            <BrandLogo size="sm" href={null} className="mx-auto mt-8 opacity-60" animated={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface EventBannerProps {
  title: string;
  description: string;
  icon: string;
  endsAt?: string;
  className?: string;
}

export function EventBanner({ title, description, icon, className }: EventBannerProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-purple-400/30 bg-gradient-to-r from-purple-950/50 via-black/60 to-amber-950/30 p-5",
        className
      )}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-amber-500/10"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <div className="relative flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="font-black text-white">{title}</p>
          <p className="text-sm text-purple-300/60">{description}</p>
        </div>
        <span className="ml-auto game-badge-purple animate-pulse">LIVE</span>
      </div>
    </motion.div>
  );
}
