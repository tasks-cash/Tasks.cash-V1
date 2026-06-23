"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  GlassCard,
  GameButton,
  RPGStatBar,
  CurrencyWallet,
  TreasureChestCard,
  EventBanner,
  AchievementCard,
  BadgeCard,
  LeaderboardCard,
} from "@tasks-cash/ui";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionHeader } from "../shared/SectionHeader";
import { ACHIEVEMENTS, BADGES, TREASURE_CHESTS, GAME_EVENTS } from "@tasks-cash/utils";

const DEMO_STATS = {
  global: { level: 24, xp: 18500, xpToNextLevel: 2000, progress: 72 },
  strength: { level: 12, xp: 4200, xpToNextLevel: 800, progress: 55 },
  intelligence: { level: 10, xp: 3100, xpToNextLevel: 600, progress: 48 },
  speed: { level: 15, xp: 5500, xpToNextLevel: 900, progress: 68 },
  luck: { level: 8, xp: 2100, xpToNextLevel: 500, progress: 42 },
  life: { level: 11, xp: 3800, xpToNextLevel: 700, progress: 58 },
  energy: { level: 14, xp: 4900, xpToNextLevel: 850, progress: 75 },
  defense: { level: 9, xp: 2600, xpToNextLevel: 550, progress: 45 },
  reputation: { level: 13, xp: 4400, xpToNextLevel: 750, progress: 62 },
};

const DEMO_CURRENCIES = {
  bronze: 12450,
  silver: 890,
  gold: 156,
  diamonds: 42,
  crystals: 128,
  legendTokens: 8,
  mythicCoins: 2,
  portalEnergy: 95,
};

/** Homepage RPG progression showcase */
export function RPGProgressionSection() {
  return (
    <CinematicSection className="py-24 md:py-32" glow="purple">
      <SectionHeader
        eyebrow="RPG System"
        title="Master Every Stat"
        subtitle="Train Strength, Intelligence, Speed, Luck, and more. Each stat unlocks new missions, worlds, and legendary rewards."
      />

      <div className="grid lg:grid-cols-3 gap-6 mb-12">
        {(Object.keys(DEMO_STATS) as (keyof typeof DEMO_STATS)[]).slice(0, 6).map((stat, i) => (
          <motion.div
            key={stat}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <RPGStatBar stat={stat} data={DEMO_STATS[stat]} />
          </motion.div>
        ))}
      </div>

      <div className="portal-divider mb-12" />

      <SectionHeader
        eyebrow="Multi-Currency"
        title="Eight Portal Currencies"
        subtitle="Earn, spend, and exchange bronze, silver, gold, gems, crystals, tokens, and mythic coins."
      />
      <CurrencyWallet currencies={DEMO_CURRENCIES} className="mb-12" />

      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="text-lg font-black text-white mb-4 font-[family-name:var(--font-cinzel)]">Live Events</h3>
          <div className="space-y-4">
            {GAME_EVENTS.slice(0, 3).map((event) => (
              <EventBanner key={event.id} title={event.title} description={event.description} icon={event.icon} />
            ))}
          </div>
        </div>
        <LeaderboardCard
          title="Top Explorers"
          entries={[
            { rank: 1, name: "VoidEmperor", score: "◈ 98,420", avatar: "👑" },
            { rank: 2, name: "PortalQueen", score: "◈ 87,200", avatar: "💎" },
            { rank: 3, name: "StarRunner", score: "◈ 76,890", avatar: "⚡" },
          ]}
        />
      </div>

      <SectionHeader eyebrow="Treasure System" title="Open Legendary Chests" subtitle="Hidden, Epic, Legendary, Mythic, and Quantum chests with animated openings." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {TREASURE_CHESTS.slice(0, 3).map((chest, i) => (
          <motion.div
            key={chest.id}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <TreasureChestCard chest={chest} />
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Achievements</h3>
          <div className="space-y-3">
            {ACHIEVEMENTS.slice(0, 4).map((a, i) => (
              <AchievementCard key={a.id} achievement={a} unlocked={i < 2} />
            ))}
          </div>
        </GlassCard>
        <GlassCard glow="gold" className="p-6">
          <h3 className="text-lg font-bold text-amber-300 mb-4">Badge Collection</h3>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.slice(0, 6).map((b, i) => (
              <BadgeCard key={b.id} badge={b} earned={i < 3} />
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard glow="violet" className="p-8 md:p-12 text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-purple-400/60 mb-4">Live Reward System</p>
        <h3 className="text-3xl md:text-4xl font-black text-white mb-4 font-[family-name:var(--font-cinzel)]">
          Earn While You Browse
        </h3>
        <p className="text-purple-200/50 max-w-2xl mx-auto mb-8">
          Random XP, coins, gems, treasures, and achievements appear as animated toast notifications while you explore the portal.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/register"><GameButton variant="gold" pulse size="lg">Start Your Journey</GameButton></Link>
          <Link href="/dashboard"><GameButton variant="purple" size="lg">Enter Command Center</GameButton></Link>
        </div>
      </GlassCard>
    </CinematicSection>
  );
}
