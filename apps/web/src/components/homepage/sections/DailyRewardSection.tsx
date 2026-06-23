"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameButton } from "@tasks-cash/ui";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionTitle } from "../components/SectionTitle";

function useCountdown() {
  const [time, setTime] = useState({ h: 14, m: 32, s: 18 });

  useEffect(() => {
    const id = setInterval(() => {
      setTime((prev) => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

export function DailyRewardSection() {
  const countdown = useCountdown();

  return (
    <CinematicSection id="daily-reward" glow="gold" parallax>
      <SectionTitle
        eyebrow="Daily Mystery Reward"
        title="Claim Your Portal Bonus"
        subtitle="A new legendary reward unlocks every 24 hours. Don't miss today's drop."
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto hp-glass-panel rounded-3xl border border-amber-400/30 p-8 md:p-12 text-center overflow-hidden relative"
      >
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            background: "conic-gradient(from 0deg, rgba(212,175,55,0.1), rgba(124,58,237,0.1), rgba(212,175,55,0.1))",
          }}
        />
        <div className="relative z-10">
          <motion.div
            className="text-8xl mb-6 inline-block"
            animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🎁
          </motion.div>
          <h3 className="text-2xl md:text-3xl font-black text-amber-300 mb-2 font-[family-name:var(--font-cinzel)]">
            Mystery Legendary Chest
          </h3>
          <p className="text-purple-200/50 mb-8 font-[family-name:var(--font-inter)]">
            Possible drops: Epic coins, rare artifacts, XP boosts, exclusive skins
          </p>

          <div className="flex justify-center gap-4 md:gap-8 mb-8">
            {[
              { label: "Hours", value: countdown.h },
              { label: "Min", value: countdown.m },
              { label: "Sec", value: countdown.s },
            ].map((unit) => (
              <div key={unit.label} className="hp-countdown-unit px-4 py-3 md:px-6 md:py-4 rounded-xl border border-purple-500/30 bg-black/50 min-w-[70px]">
                <p className="text-2xl md:text-4xl font-black text-white font-[family-name:var(--font-orbitron)]">
                  {String(unit.value).padStart(2, "0")}
                </p>
                <p className="text-[9px] uppercase tracking-widest text-purple-400/50 mt-1">{unit.label}</p>
              </div>
            ))}
          </div>

          <GameButton variant="gold" size="lg" pulse className="hp-btn-glow font-[family-name:var(--font-rajdhani)] uppercase tracking-widest px-12" data-sound="daily-reward">
            Claim Daily Reward
          </GameButton>
        </div>
      </motion.div>
    </CinematicSection>
  );
}
