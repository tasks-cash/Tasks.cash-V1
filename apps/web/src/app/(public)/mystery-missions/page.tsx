"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { IMysteryMissionView, MysteryMissionCategory } from "@tasks-cash/types";
import {
  BrandLogo,
  GlowText,
  PortalButton,
  ParticleField,
  MysteryMissionCard,
  MysteryUnlockPopup,
  MysteryCategoryTabs,
  StatCard,
  MotionStagger,
  MotionStaggerItem,
} from "@tasks-cash/ui";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import {
  MYSTERY_MISSIONS_DATA,
  filterMysteryMissions,
  countByCategory,
  getDemoUnlockMission,
} from "@/lib/mystery-missions-data";
import { apiFetch } from "@/lib/api";

export default function MysteryMissionsPage() {
  const [missions, setMissions] = useState<IMysteryMissionView[]>(MYSTERY_MISSIONS_DATA);
  const [category, setCategory] = useState<MysteryMissionCategory | "all">("all");
  const [popupMission, setPopupMission] = useState<IMysteryMissionView | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    apiFetch<IMysteryMissionView[]>("/api/mystery-missions").then((res) => {
      if (res.success && res.data?.length) setMissions(res.data);
    });
  }, []);

  const filtered = useMemo(() => filterMysteryMissions(missions, category), [missions, category]);
  const counts = useMemo(() => countByCategory(missions), [missions]);
  const lockedCount = missions.filter((m) => m.playerState === "locked").length;
  const revealedCount = missions.filter((m) => m.isRevealed).length;

  const triggerDemoUnlock = useCallback(() => {
    const demo = getDemoUnlockMission(missions);
    if (!demo) return;
    const revealed: IMysteryMissionView = { ...demo, isRevealed: true, playerState: "unlocked" };
    setPopupMission(revealed);
    setShowPopup(true);
    setMissions((prev) =>
      prev.map((m) => (m._id === demo._id ? { ...m, isRevealed: true, playerState: "unlocked" } : m))
    );
  }, [missions]);

  return (
    <PublicPageWrapper>
      <MysteryUnlockPopup
        mission={popupMission}
        open={showPopup}
        onClose={() => setShowPopup(false)}
        onStart={() => {}}
      />

      {/* Cinematic vault header */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-4 pt-12 pb-20 overflow-hidden">
        <ParticleField count={70} />
        <div className="mystery-vault-fog absolute inset-0 pointer-events-none" />
        <div className="portal-ring absolute h-[600px] w-[600px] opacity-10 animate-portal-spin" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-black"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl"
        >
          <BrandLogo size="md" href="/" className="mx-auto mb-6" animated />
          <motion.p
            className="text-[10px] uppercase tracking-[0.5em] text-purple-400/60 mb-4"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ◈ Classified Archive ◈
          </motion.p>
          <GlowText
            as="h1"
            variant="gold"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 font-[family-name:var(--font-cinzel)]"
          >
            Mystery Missions
          </GlowText>
          <p className="text-purple-200/50 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Enter the secret archive. Most missions remain sealed in darkness — unlock them through
            exploration, progression, and portal rituals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <PortalButton variant="gold" size="lg" pulse data-sound="enter-archive">
                Enter The Archive
              </PortalButton>
            </Link>
            <PortalButton variant="secondary" size="lg" onClick={triggerDemoUnlock} data-sound="demo-unlock">
              Simulate Discovery
            </PortalButton>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-purple-500/40"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Descend into the vault ↓
        </motion.div>
      </section>

      {/* Stats band */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 -mt-8 mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Missions" value={missions.length} icon="📜" glow="violet" />
          <StatCard label="Sealed" value={lockedCount} icon="🔒" />
          <StatCard label="Revealed" value={revealedCount} icon="👁️" glow="gold" />
          <StatCard label="Categories" value={12} icon="◈" glow="purple" />
        </div>
      </section>

      {/* Category tabs + grid */}
      <section className="relative mx-auto max-w-7xl px-4 pb-24">
        <div className="portal-divider mb-10" />
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white font-[family-name:var(--font-cinzel)]">
              Secret Mission Vault
            </h2>
            <p className="text-purple-400/50 text-sm mt-1">
              {filtered.length} missions in this archive sector · {lockedCount} remain classified
            </p>
          </div>
          <MysteryCategoryTabs active={category} onChange={setCategory} counts={counts} />
        </div>

        <MotionStagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((mission) => (
            <MotionStaggerItem key={mission._id}>
              <MysteryMissionCard
                mission={mission}
                onStart={(m) => {
                  setMissions((prev) =>
                    prev.map((x) => (x._id === m._id ? { ...x, playerState: "in_progress" } : x))
                  );
                }}
              />
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-purple-400/40">
            <p className="text-4xl mb-4">???</p>
            <p>No missions in this archive sector.</p>
          </div>
        )}
      </section>

      {/* Unlock legend */}
      <section className="relative border-t border-purple-500/10 py-20 px-4">
        <ParticleField count={30} className="opacity-30" />
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <GlowText as="h2" className="text-3xl mb-6 font-[family-name:var(--font-cinzel)]">
            Unlock the Unknown
          </GlowText>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-left mb-10">
            {[
              { icon: "⚡", label: "Reach Level 5", desc: "Awakens video & AI archives" },
              { icon: "🔗", label: "Invite 3 Friends", desc: "Opens referral constellation" },
              { icon: "💎", label: "Open 3 Chests", desc: "Reveals hidden triad ritual" },
              { icon: "📅", label: "7-Day Login", desc: "Unlocks weekly void hunt" },
              { icon: "👑", label: "Founder Status", desc: "Legendary founder sigil" },
              { icon: "🎭", label: "Special Events", desc: "Limited-time portal missions" },
            ].map((item) => (
              <motion.div
                key={item.label}
                whileHover={{ scale: 1.02 }}
                className="rounded-xl border border-purple-500/20 bg-black/40 p-4 backdrop-blur-xl"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="font-bold text-white mt-2">{item.label}</p>
                <p className="text-purple-400/50 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          <Link href="/register">
            <PortalButton variant="gold" size="lg" pulse>
              Start Your Journey
            </PortalButton>
          </Link>
        </div>
      </section>
    </PublicPageWrapper>
  );
}
