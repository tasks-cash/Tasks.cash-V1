"use client";

import { motion } from "framer-motion";
import { BrandLogo, GlassCard, MotionReveal, ParticleField } from "@tasks-cash/ui";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex overflow-hidden bg-black">
      <ParticleField count={50} />

      {/* Left cinematic portal artwork */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 border-r border-purple-500/10">
        <div className="portal-ring absolute h-[500px] w-[500px] opacity-20 animate-portal-spin" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-amber-900/10"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 text-center"
        >
          <BrandLogo size="hero" href="/" showTagline animated />
          <p className="mt-8 max-w-md text-purple-200/50 text-sm leading-relaxed">
            Step through the dimensional gateway. Your journey to legendary rewards begins here.
          </p>
          <div className="three-placeholder mt-10 mx-auto max-w-sm" data-label="3D Portal — React Three Fiber Ready" />
        </motion.div>
      </div>

      {/* Right glass login card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <MotionReveal className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <BrandLogo size="md" href="/" showTagline />
          </div>
          <GlassCard glow="violet" className="p-8 md:p-10">
            <div className="hidden lg:flex justify-center mb-6">
              <BrandLogo size="sm" href="/" animated={false} />
            </div>
            <h1 className="text-2xl font-black text-white text-center font-[family-name:var(--font-cinzel)]">{title}</h1>
            {subtitle && <p className="text-purple-300/60 text-sm mt-2 text-center">{subtitle}</p>}
            <div className="portal-divider my-6" />
            {children}
          </GlassCard>
        </MotionReveal>
      </div>
    </div>
  );
}
