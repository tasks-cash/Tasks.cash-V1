"use client";

import { CHALLENGE_RULES } from "@/data/mock-data";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { motion } from "framer-motion";

export function RulesSection() {
  return (
    <SectionShell
      id="rules"
      eyebrow="Fair Play"
      title="Challenge Rules"
      subtitle="Clear rules keep the arena fair. Read before you compete."
      minHeight={false}
    >
      <GlowCard glow="purple" hover={false} className="p-6 md:p-10 lg:p-12">
        <ol className="space-y-4 md:space-y-6">
          {CHALLENGE_RULES.map((rule, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="flex gap-4 md:gap-6 items-start"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-purple-500/40 bg-purple-950/50 text-xs font-black text-violet-300">
                {i + 1}
              </span>
              <p className="text-purple-200/70 text-sm md:text-base leading-relaxed pt-1">{rule}</p>
            </motion.li>
          ))}
        </ol>
      </GlowCard>
    </SectionShell>
  );
}
