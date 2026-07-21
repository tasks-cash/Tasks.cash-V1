"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard, PortalButton } from "@tasks-cash/ui";
import type { IDNARecommendation } from "@tasks-cash/types";

interface RecommendedForYouProps {
  recommendations: IDNARecommendation[];
}

export function RecommendedForYou({ recommendations }: RecommendedForYouProps) {
  return (
    <section className="mb-10">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/50 font-bold mb-2">Personalized</p>
        <h2 className="text-2xl md:text-3xl font-black text-white">Recommended For You</h2>
        <p className="text-sm text-purple-300/55 mt-2">Best missions based on your Explorer DNA match scores.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {recommendations.map((rec, i) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassCard glow="gold" className="p-5 md:p-6 h-full border-amber-400/20">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-black text-white text-lg">{rec.title}</h3>
                <span className="shrink-0 rounded-lg border border-amber-400/30 bg-amber-950/40 px-2 py-1 text-sm font-black text-amber-400">
                  {rec.matchScore}%
                </span>
              </div>
              <p className="text-xs text-purple-400/50 uppercase tracking-wider mb-2">{rec.difficulty} · DNA Match</p>
              <p className="text-sm text-purple-300/70 mb-3">{rec.reason}</p>
              <p className="text-sm font-semibold text-amber-400 mb-4">🎁 {rec.rewardPreview}</p>
              <Link href="/video-hunter">
                <PortalButton variant="gold" size="sm">
                  View Mission
                </PortalButton>
              </Link>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
