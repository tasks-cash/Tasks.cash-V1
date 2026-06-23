"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassCard, PortalButton, MotionReveal } from "@tasks-cash/ui";
import { motion, AnimatePresence } from "framer-motion";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader } from "@/components/pages/PublicSections";
import { FAQ_ITEMS } from "@/lib/mock-data";

const EXTRA_FAQ = [
  { q: "How do referrals work?", a: "Share your unique referral code. When allies register and complete their first mission, you earn 500 bonus coins per referral." },
  { q: "What are portal coins?", a: "Portal coins are the platform's virtual currency. Earn them through missions and spend them in the marketplace or withdraw eligible balances." },
  { q: "How do levels work?", a: "Gain XP from missions, daily logins, and challenges. Each level unlocks new titles, missions, and cosmetic rewards." },
  { q: "Is Tasks.cash free?", a: "Yes — creating an account and completing missions is free. Optional marketplace purchases use earned portal coins." },
  { q: "How do I submit mission proof?", a: "Go to Dashboard → Submit Proof, upload your verification, and our team reviews within 24 hours." },
  { q: "What happens if my proof is rejected?", a: "You'll receive a notification with the reason. You can resubmit corrected proof or open a support ticket." },
];

const ALL_FAQ = [...FAQ_ITEMS, ...EXTRA_FAQ];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Answers" title="Frequently Asked Questions" subtitle="Everything you need to know about the portal universe." variant="gold" />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <SectionHeader eyebrow="General" title="Common Questions" />
        <div className="space-y-3">
          {ALL_FAQ.map((item, i) => (
            <MotionReveal key={item.q} delay={i * 0.03}>
              <GlassCard className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-medium text-white">{item.q}</span>
                  <motion.span
                    animate={{ rotate: open === i ? 180 : 0 }}
                    className="text-purple-400 shrink-0"
                  >
                    ▼
                  </motion.span>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-purple-200/60 text-sm leading-relaxed border-t border-purple-500/10 pt-4">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </MotionReveal>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16">
        <GlassCard glow="gold" className="p-8 text-center">
          <h3 className="text-xl font-bold text-amber-300 mb-2">Still Have Questions?</h3>
          <p className="text-purple-200/60 mb-6">Our support team and Help Center have you covered.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/help"><PortalButton variant="gold">Help Center</PortalButton></Link>
            <Link href="/contact"><PortalButton variant="secondary">Contact Us</PortalButton></Link>
          </div>
        </GlassCard>
      </div>

      <EpicCTA title="Ready to Start?" subtitle="All your questions answered — now enter the portal." primaryLabel="Create Free Account" />
    </PublicPageWrapper>
  );
}
