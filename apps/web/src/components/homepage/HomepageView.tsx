"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { BrandLogo, ParticleField } from "@tasks-cash/ui";
import { HomepageHeader } from "./HomepageHeader";
import { HomepageAtmosphere } from "./effects/HomepageAtmosphere";
import { HeroPortal } from "./components/HeroPortal";
import { StatsBar } from "./components/StatsBar";
import { FirstMillionSection } from "./components/FirstMillionSection";
import { CTASection } from "./components/CTASection";

const WorldsSection = dynamic(() => import("./sections/WorldsSection").then((m) => ({ default: m.WorldsSection })));
const MissionsSection = dynamic(() => import("./sections/MissionsSection").then((m) => ({ default: m.MissionsSection })));
const TreasureSection = dynamic(() => import("./sections/TreasureSection").then((m) => ({ default: m.TreasureSection })));
const LeaderboardSection = dynamic(() => import("./sections/LeaderboardSection").then((m) => ({ default: m.LeaderboardSection })));
const ReferralSection = dynamic(() => import("./sections/ReferralSection").then((m) => ({ default: m.ReferralSection })));
const DailyRewardSection = dynamic(() => import("./sections/DailyRewardSection").then((m) => ({ default: m.DailyRewardSection })));
const CommunitySection = dynamic(() => import("./sections/CommunitySection").then((m) => ({ default: m.CommunitySection })));
const RPGProgressionSection = dynamic(() => import("./sections/RPGProgressionSection").then((m) => ({ default: m.RPGProgressionSection })));

const FOOTER_LINKS = [
  { title: "Explore", links: ["Worlds", "Missions", "Treasure", "Leaderboards"] },
  { title: "Platform", links: ["Community", "FAQ", "Help", "About"] },
  { title: "Legal", links: ["Terms", "Privacy", "Cookies", "Contact"] },
];

/** AAA game-launcher homepage — full viewport cinematic experience */
export function HomepageView() {
  return (
    <div className="homepage-root relative w-full min-h-screen overflow-x-hidden bg-black">
      <HomepageAtmosphere />
      <HomepageHeader />

      <main className="relative z-10 w-full">
        <HeroPortal />
        <StatsBar />
        <FirstMillionSection />
        <WorldsSection />
        <MissionsSection />
        <TreasureSection />
        <RPGProgressionSection />
        <LeaderboardSection />
        <ReferralSection />
        <DailyRewardSection />
        <CommunitySection />
        <CTASection />
      </main>

      <footer className="relative z-10 w-full border-t border-purple-500/15 py-16 overflow-hidden">
        <ParticleField count={20} className="opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-purple-950/30 to-transparent pointer-events-none" />
        <div className="relative w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <BrandLogo size="md" href="/" showTagline />
              <p className="text-purple-400/50 text-sm mt-4 leading-relaxed font-[family-name:var(--font-inter)]">
                PLAY • COMPLETE • EARN — The premium gamified reward universe.
              </p>
            </div>
            {FOOTER_LINKS.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-bold text-purple-200 mb-4 uppercase tracking-wider font-[family-name:var(--font-orbitron)]">
                  {section.title}
                </h4>
                <ul className="space-y-2">
                  {section.links.map((label) => (
                    <li key={label}>
                      <Link href={`/${label.toLowerCase()}`} className="text-sm text-purple-300/60 hover:text-amber-300 transition-colors font-[family-name:var(--font-inter)]">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-purple-500/10"
          >
            <div className="flex items-center gap-3">
              <BrandLogo size="xs" href="/" animated={false} />
              <p className="text-purple-400/40 text-sm font-[family-name:var(--font-inter)]">© 2026 Tasks.cash — All dimensions reserved.</p>
            </div>
            <div className="flex gap-4 text-sm text-purple-400/50">
              <Link href="/terms" className="hover:text-purple-200">Terms</Link>
              <Link href="/privacy" className="hover:text-purple-200">Privacy</Link>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
