"use client";

import { SPECIAL_MISSIONS } from "@/data/mock-data";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DIFFICULTY_COLORS: Record<string, string> = {
  Medium: "border-yellow-400/40 text-yellow-300 bg-yellow-950/30",
  Hard: "border-orange-400/40 text-orange-300 bg-orange-950/30",
  Epic: "border-purple-400/40 text-purple-300 bg-purple-950/30",
  Legendary: "border-amber-400/40 text-amber-300 bg-amber-950/30 animate-pulse-gold",
};

export function SpecialMissionsSection() {
  return (
    <SectionShell
      id="special-missions"
      eyebrow="Mode 04"
      title="Special Missions"
      subtitle="Manual elite tasks assigned by portal command. Limited slots. Massive rewards."
    >
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
        {SPECIAL_MISSIONS.map((mission, i) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
          >
            <GlowCard
              glow={mission.difficulty === "Legendary" ? "gold" : "violet"}
              className="h-full p-6 md:p-8 flex flex-col min-h-[280px]"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{mission.icon}</span>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                    DIFFICULTY_COLORS[mission.difficulty]
                  )}
                >
                  {mission.difficulty}
                </span>
              </div>
              <h4 className="text-lg md:text-xl font-black text-white mb-2">{mission.title}</h4>
              <p className="text-amber-400 font-black text-2xl mb-4">{mission.reward}</p>
              <p className="text-purple-400/50 text-sm mb-6 flex-1">
                {mission.slots} slots remaining
              </p>
              <ArenaButton variant="purple" size="md" className="w-full">
                Accept Mission
              </ArenaButton>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
