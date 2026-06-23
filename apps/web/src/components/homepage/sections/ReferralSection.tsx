"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameButton } from "@tasks-cash/ui";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionTitle } from "../components/SectionTitle";
import { REFERRAL_TIERS } from "../data/homepage-data";

export function ReferralSection() {
  return (
    <CinematicSection id="referral" glow="gold">
      <SectionTitle
        eyebrow="Referral Rewards"
        title="Invite Allies to the Portal"
        subtitle="Recruit friends and earn permanent bonus coins for every explorer they bring."
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {REFERRAL_TIERS.map((tier, i) => (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            className="hp-glass-panel rounded-2xl border border-amber-400/20 p-6 text-center"
          >
            <span className="hp-badge-gold inline-block mb-3">{tier.tier}</span>
            <p className="text-3xl font-black text-amber-400 mb-1 font-[family-name:var(--font-orbitron)]">{tier.invites}+</p>
            <p className="text-xs text-purple-400/50 uppercase tracking-widest mb-3">Invites</p>
            <p className="text-white font-bold mb-1 font-[family-name:var(--font-cinzel)]">{tier.reward}</p>
            <p className="text-sm text-violet-300/60">{tier.bonus}</p>
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link href="/register">
          <GameButton variant="gold" size="lg" pulse className="hp-btn-glow font-[family-name:var(--font-rajdhani)] uppercase tracking-widest">
            Claim Founder Status
          </GameButton>
        </Link>
      </div>
    </CinematicSection>
  );
}
