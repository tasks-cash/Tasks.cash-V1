"use client";

import { motion } from "framer-motion";
import { CinematicSection } from "../shared/CinematicSection";
import { SectionTitle } from "../components/SectionTitle";

const SOCIAL = [
  { name: "Discord", icon: "💬", members: "45K+", color: "from-indigo-600/40 to-indigo-950/60", href: "#" },
  { name: "Telegram", icon: "✈️", members: "28K+", color: "from-sky-600/40 to-sky-950/60", href: "#" },
  { name: "Instagram", icon: "📸", members: "32K+", color: "from-pink-600/40 to-purple-950/60", href: "#" },
  { name: "TikTok", icon: "🎵", members: "18K+", color: "from-cyan-600/40 to-black/60", href: "#" },
  { name: "Facebook", icon: "📘", members: "24K+", color: "from-blue-600/40 to-blue-950/60", href: "#" },
  { name: "YouTube", icon: "▶️", members: "18K+", color: "from-red-600/40 to-red-950/60", href: "#" },
];

interface CommunityCardProps {
  name: string;
  icon: string;
  members: string;
  color: string;
  href: string;
}

export function CommunityCard({ name, icon, members, color, href }: CommunityCardProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`hp-community-card group block rounded-2xl border border-purple-500/20 bg-gradient-to-br ${color} p-6 md:p-8 text-center overflow-hidden relative`}
      data-sound="social"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <motion.span
        className="relative z-10 text-5xl md:text-6xl block mb-4"
        whileHover={{ scale: 1.15 }}
      >
        {icon}
      </motion.span>
      <h3 className="relative z-10 text-xl font-black text-white mb-1 font-[family-name:var(--font-cinzel)] group-hover:text-amber-200 transition-colors">
        {name}
      </h3>
      <p className="relative z-10 text-sm text-purple-300/60 font-[family-name:var(--font-rajdhani)] uppercase tracking-wider">
        {members} Members
      </p>
      <span className="relative z-10 mt-4 inline-block text-xs text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity font-[family-name:var(--font-orbitron)] uppercase tracking-widest">
        Join →
      </span>
    </motion.a>
  );
}

export function CommunitySection() {
  return (
    <CinematicSection id="community" glow="purple">
      <SectionTitle
        eyebrow="Community Hub"
        title="Join the Portal Legion"
        subtitle="Connect with millions of explorers across every dimension."
      />
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
        {SOCIAL.map((social, i) => (
          <motion.div
            key={social.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <CommunityCard {...social} />
          </motion.div>
        ))}
      </div>
    </CinematicSection>
  );
}
