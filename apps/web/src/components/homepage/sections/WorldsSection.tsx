"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GameButton } from "@tasks-cash/ui";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionTitle } from "../components/SectionTitle";
import { WorldCard } from "../components/WorldCard";
import { FEATURED_WORLDS } from "../data/homepage-data";

export function WorldsSection() {
  return (
    <CinematicSection id="worlds" glow="purple" parallax>
      <SectionTitle
        eyebrow="Explore Worlds"
        title="Dimensional Realms Await"
        subtitle="Each world holds unique missions, legendary loot, and infinite challenges."
      />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {FEATURED_WORLDS.map((world, i) => (
          <motion.div
            key={world.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <WorldCard {...world} level={10 + i * 5} rewards={i % 2 === 0 ? "Legendary Drops" : "Epic Chests"} />
          </motion.div>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <Link href="/worlds">
          <GameButton variant="purple" size="lg" className="font-[family-name:var(--font-rajdhani)] uppercase tracking-widest px-12">
            Explore All Worlds
          </GameButton>
        </Link>
      </div>
    </CinematicSection>
  );
}
