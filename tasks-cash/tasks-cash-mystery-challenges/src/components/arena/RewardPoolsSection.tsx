"use client";

import { REWARD_POOLS } from "@/data/mock-data";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { motion } from "framer-motion";

export function RewardPoolsSection() {
  return (
    <SectionShell
      id="reward-pools"
      eyebrow="Treasure Vault"
      title="Reward Pools"
      subtitle="Massive coin pools distributed across daily, weekly, monthly, and seasonal cycles."
    >
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {REWARD_POOLS.map((pool, i) => (
          <motion.div
            key={pool.period}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <GlowCard
              glow={pool.glow === "gold" ? "gold" : "violet"}
              className="p-6 md:p-8 lg:p-10 min-h-[260px] md:min-h-[300px] flex flex-col items-center text-center"
            >
              <span className="text-5xl md:text-6xl mb-4">{pool.icon}</span>
              <p className="arena-subheading mb-2">{pool.period} Pool</p>
              <p
                className={`text-3xl md:text-4xl lg:text-5xl font-black mb-4 ${
                  pool.glow === "gold" ? "text-amber-400" : "text-white"
                }`}
              >
                {pool.amount}
              </p>
              <p className="text-purple-400/50 text-sm">{pool.winners} winners per cycle</p>
              <motion.div
                className="mt-auto pt-6 w-full h-1 rounded-full bg-purple-950/80 overflow-hidden"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400"
                  initial={{ width: "0%" }}
                  whileInView={{ width: `${60 + i * 10}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2 + i * 0.1 }}
                />
              </motion.div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </SectionShell>
  );
}
