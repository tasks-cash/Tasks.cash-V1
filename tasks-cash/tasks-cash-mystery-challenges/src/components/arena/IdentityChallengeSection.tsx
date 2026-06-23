"use client";

import { useState } from "react";
import { IDENTITY_QUESTIONS } from "@/data/mock-data";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { motion, AnimatePresence } from "framer-motion";

export function IdentityChallengeSection() {
  const [step, setStep] = useState(0);
  const current = IDENTITY_QUESTIONS[step];
  const total = IDENTITY_QUESTIONS.length;

  return (
    <SectionShell
      id="identity-challenge"
      eyebrow="Mode 03"
      title="Identity Challenge"
      subtitle="Prove your portal identity through an encrypted question wizard."
    >
      <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <GlowCard glow="violet" hover={false} className="p-6 md:p-10 lg:p-12 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <p className="arena-subheading">Question Wizard</p>
            <span className="text-sm text-purple-400/60 font-mono">
              Step {step + 1} / {total}
            </span>
          </div>

          <div className="flex gap-2 mb-8">
            {IDENTITY_QUESTIONS.map((q, i) => (
              <div
                key={q.step}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-gradient-to-r from-purple-500 to-amber-400" : "bg-purple-950/80"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="flex-1"
            >
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-4">{current.question}</h3>
              <p className="text-purple-400/50 text-sm mb-8">{current.hint}</p>
              <input
                type="text"
                placeholder="Enter your answer..."
                className="w-full rounded-xl border border-purple-500/30 bg-black/50 px-5 py-4 text-white placeholder:text-purple-400/30 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-4 mt-8">
            <ArenaButton
              variant="ghost"
              size="md"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </ArenaButton>
            <ArenaButton
              variant="gold"
              size="md"
              onClick={() => setStep((s) => (s < total - 1 ? s + 1 : 0))}
            >
              {step < total - 1 ? "Next Question" : "Restart Preview"}
            </ArenaButton>
          </div>
        </GlowCard>

        <div className="flex flex-col gap-6">
          <GlowCard glow="gold" className="p-6 md:p-8">
            <span className="text-4xl mb-4 block">🎭</span>
            <h4 className="text-xl font-black text-white mb-2">Encrypted Verification</h4>
            <p className="text-purple-200/55 text-sm leading-relaxed">
              Identity challenges rotate every portal cycle. Correct answers unlock exclusive mystery missions and bonus reward multipliers.
            </p>
          </GlowCard>
          <GlowCard glow="purple" className="p-6 md:p-8">
            <span className="text-4xl mb-4 block">🔐</span>
            <h4 className="text-xl font-black text-white mb-2">Single Attempt Rule</h4>
            <p className="text-purple-200/55 text-sm leading-relaxed">
              Each explorer gets one verification attempt per cycle. Failed attempts lock for 24 portal hours before retry.
            </p>
          </GlowCard>
          <GlowCard glow="violet" className="p-6 md:p-8">
            <span className="text-4xl mb-4 block">💎</span>
            <h4 className="text-xl font-black text-white mb-2">Inner Circle Access</h4>
            <p className="text-purple-200/55 text-sm leading-relaxed">
              Verified explorers gain access to secret raids and seasonal champion brackets.
            </p>
          </GlowCard>
        </div>
      </div>
    </SectionShell>
  );
}
