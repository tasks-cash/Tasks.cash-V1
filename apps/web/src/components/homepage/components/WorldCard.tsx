"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface WorldCardProps {
  id: string;
  name: string;
  desc: string;
  difficulty: string;
  missions: number;
  explorers: number;
  icon: string;
  gradient: string;
  level?: number;
  rewards?: string;
}

export function WorldCard({
  name,
  desc,
  difficulty,
  missions,
  explorers,
  icon,
  gradient,
  level = 1,
  rewards = "Epic Loot",
}: WorldCardProps) {
  const diffColor =
    difficulty === "Legendary"
      ? "text-amber-400 border-amber-400/40 bg-amber-950/40"
      : difficulty === "Hard"
        ? "text-orange-400 border-orange-400/40 bg-orange-950/30"
        : difficulty === "Medium"
          ? "text-violet-300 border-violet-400/40 bg-violet-950/30"
          : "text-emerald-400 border-emerald-400/40 bg-emerald-950/30";

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group relative h-full min-h-[420px] rounded-2xl overflow-hidden border border-purple-500/20 hp-world-card"
    >
      {/* Large artwork area */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-black`}>
        <div className="absolute inset-0 flex items-center justify-center text-[120px] opacity-20 group-hover:opacity-35 group-hover:scale-110 transition-all duration-700">
          {icon}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: "radial-gradient(circle at 50% 80%, rgba(124,58,237,0.3), transparent 60%)" }}
        />
      </div>

      {/* Level badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="hp-badge-purple px-3 py-1 rounded-full text-[10px] font-[family-name:var(--font-orbitron)] font-bold uppercase tracking-wider">
          Lvl {level}+
        </span>
      </div>

      {/* Difficulty */}
      <div className="absolute top-4 right-4 z-10">
        <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${diffColor}`}>
          {difficulty}
        </span>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-8">
        <h3 className="text-2xl md:text-3xl font-black text-white mb-2 font-[family-name:var(--font-cinzel)] group-hover:text-amber-200 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-purple-200/60 mb-4 line-clamp-2 font-[family-name:var(--font-inter)]">{desc}</p>
        <div className="flex flex-wrap gap-3 text-xs font-[family-name:var(--font-rajdhani)] font-semibold uppercase tracking-wider">
          <span className="text-purple-300/70">⚔️ {missions} Missions</span>
          <span className="text-amber-400/80">🎁 {rewards}</span>
          <span className="text-purple-300/70">👥 {(explorers / 1000).toFixed(0)}K Explorers</span>
        </div>
        <Link
          href="/worlds"
          className="mt-4 inline-flex items-center gap-2 text-sm text-violet-300 hover:text-amber-300 font-[family-name:var(--font-orbitron)] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
        >
          Enter World →
        </Link>
      </div>

      {/* Glow border on hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-violet-400/50 transition-colors pointer-events-none" />
    </motion.div>
  );
}
