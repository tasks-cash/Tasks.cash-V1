"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@tasks-cash/ui";
import type { DNAMatchScore } from "@tasks-cash/types";

interface DnaMatchEngineProps {
  scores: DNAMatchScore[];
}

export function DnaMatchEngine({ scores }: DnaMatchEngineProps) {
  return (
    <section className="mb-10 md:mb-14">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/50 font-bold mb-2">Match Engine</p>
        <h2 className="text-2xl md:text-3xl font-black text-white">DNA Match Score</h2>
        <p className="text-sm text-purple-300/55 mt-2">How well your Explorer DNA aligns with each mission category.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {scores.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.45 }}
            whileHover={{ y: -4 }}
          >
            <GlassCard
              glow={item.score >= 90 ? "gold" : item.score >= 75 ? "violet" : "purple"}
              className="p-5 text-center h-full"
            >
              <span className="text-2xl block mb-2">{item.icon}</span>
              <p className="text-[10px] uppercase tracking-wider text-purple-400/50 mb-2 min-h-[2rem] leading-tight">{item.label}</p>
              <p className="text-3xl font-black text-amber-400">{item.score}%</p>
              <div className="mt-3 h-1.5 rounded-full bg-black/50 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 to-amber-400"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.08 }}
                />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
