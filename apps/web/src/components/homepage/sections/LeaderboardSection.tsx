"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameButton } from "@tasks-cash/ui";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionTitle } from "../components/SectionTitle";
import { LEADERBOARD } from "../data/homepage-data";

const RANK_STYLES: Record<number, string> = {
  1: "border-amber-400/50 bg-gradient-to-br from-amber-950/50 to-black shadow-glow-gold",
  2: "border-slate-400/40 bg-gradient-to-br from-slate-950/50 to-black",
  3: "border-orange-400/40 bg-gradient-to-br from-orange-950/30 to-black",
};

export function LeaderboardSection() {
  return (
    <CinematicSection id="leaderboard" glow="purple">
      <SectionTitle
        eyebrow="Leaderboards"
        title="Top Portal Warriors"
        subtitle="The greatest explorers ranked by XP, coins, and dimensional conquests."
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
        {LEADERBOARD.slice(0, 5).map((player, i) => (
          <motion.div
            key={player.rank}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, x: 4 }}
            className={`hp-leader-card flex items-center gap-4 rounded-2xl border p-5 md:p-6 ${
              RANK_STYLES[player.rank] ?? "border-purple-500/20 bg-black/50"
            } ${i === 0 ? "md:col-span-2 xl:col-span-1 xl:row-span-1" : ""}`}
          >
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-black text-2xl font-[family-name:var(--font-orbitron)] ${
              player.rank === 1 ? "bg-amber-400/20 text-amber-400" : "bg-purple-900/40 text-purple-300"
            }`}>
              #{player.rank}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-black text-white truncate font-[family-name:var(--font-cinzel)]">{player.username}</p>
              <p className="text-xs text-purple-400/60 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
                Level {player.level} · ◈ {player.coins.toLocaleString()}
              </p>
              <p className="text-sm text-violet-300/70 mt-1">{player.xp.toLocaleString()} XP</p>
            </div>
            {player.rank === 1 && <span className="text-3xl">👑</span>}
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link href="/leaderboards">
          <GameButton variant="purple" size="lg" className="font-[family-name:var(--font-rajdhani)] uppercase tracking-widest px-12">
            View Leaderboards
          </GameButton>
        </Link>
      </div>
    </CinematicSection>
  );
}
