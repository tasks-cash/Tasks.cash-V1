"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BrandLogo, PortalButton, GlassCard, ParticleField } from "@tasks-cash/ui";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-black">
      <ParticleField count={50} />
      <div className="portal-ring absolute h-[400px] w-[400px] opacity-10 animate-portal-spin" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center max-w-lg"
      >
        <BrandLogo size="lg" href="/" className="mx-auto mb-8" />
        <motion.p
          className="text-8xl md:text-9xl font-black bg-gradient-to-b from-purple-400 to-amber-400 bg-clip-text text-transparent mb-4"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          404
        </motion.p>
        <h1 className="text-2xl md:text-3xl mb-4 font-black text-white font-[family-name:var(--font-cinzel)]">
          Lost in the Void
        </h1>
        <p className="text-purple-200/60 mb-8 leading-relaxed">
          This dimension does not exist. The portal you seek has collapsed into the multiverse abyss.
        </p>
        <GlassCard className="p-6 mb-8 inline-block">
          <p className="text-sm text-purple-400/60">Error Code: VOID-NOT-FOUND</p>
        </GlassCard>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <PortalButton variant="gold" size="lg" pulse>Return to Portal</PortalButton>
          </Link>
          <Link href="/help">
            <PortalButton variant="secondary" size="lg">Help Center</PortalButton>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
