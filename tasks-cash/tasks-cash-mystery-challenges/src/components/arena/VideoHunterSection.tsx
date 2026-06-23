"use client";

import { VIDEO_RAIDS } from "@/data/mock-data";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { motion } from "framer-motion";

function StatusBadge({ status }: { status: "live" | "upcoming" | "past" }) {
  if (status === "live") return <span className="status-live"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live</span>;
  if (status === "upcoming") return <span className="status-upcoming">Upcoming</span>;
  return <span className="status-past">Past</span>;
}

export function VideoHunterSection() {
  const { permanent, timed } = VIDEO_RAIDS;
  const live = timed.filter((r) => r.status === "live");
  const upcoming = timed.filter((r) => r.status === "upcoming");
  const past = timed.filter((r) => r.status === "past");

  return (
    <SectionShell
      id="video-hunter"
      eyebrow="Mode 01"
      title="Video Hunter"
      subtitle="Hunt viral content. Submit links. Dominate timed raids and permanent missions."
    >
      <GlowCard glow="violet" hover={false} className="mb-8 p-6 md:p-10 lg:p-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="arena-subheading mb-2">Permanent Mission</p>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white mb-2">{permanent.title}</h3>
            <p className="text-amber-400 font-bold text-lg md:text-xl">{permanent.reward}</p>
            <p className="text-purple-400/50 text-sm mt-2">
              {permanent.submitted} / {permanent.target} links submitted
            </p>
          </div>
          <div className="w-full lg:w-96">
            <div className="h-3 rounded-full bg-purple-950/80 border border-purple-500/30 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 via-violet-400 to-amber-400"
                initial={{ width: 0 }}
                whileInView={{ width: `${permanent.progress}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <p className="text-right text-xs text-purple-400/50 mt-2">{permanent.progress}% complete</p>
          </div>
        </div>
        <ArenaButton variant="gold" size="lg" className="mt-8">
          Submit Video Link
        </ArenaButton>
      </GlowCard>

      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">
        {[
          { label: "Live Raids", items: live, empty: "No live raids" },
          { label: "Upcoming", items: upcoming, empty: "None scheduled" },
          { label: "Past Raids", items: past, empty: "No history" },
        ].map((group) => (
          <div key={group.label}>
            <h4 className="arena-subheading mb-4">{group.label}</h4>
            <div className="space-y-4">
              {group.items.length === 0 ? (
                <p className="text-purple-400/40 text-sm">{group.empty}</p>
              ) : (
                group.items.map((raid) => (
                  <GlowCard key={raid.id} glow="purple" className="p-5 md:p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h5 className="font-bold text-white text-base md:text-lg">{raid.name}</h5>
                      <StatusBadge status={raid.status} />
                    </div>
                    <p className="text-amber-400 font-black text-xl mb-2">{raid.pool}</p>
                    {raid.status === "live" && (
                      <p className="text-sm text-purple-300/60">Ends in {raid.endsIn} · {raid.participants} raiders</p>
                    )}
                    {raid.status === "upcoming" && (
                      <p className="text-sm text-purple-300/60">Starts in {raid.startsIn}</p>
                    )}
                    {raid.status === "past" && (
                      <p className="text-sm text-purple-300/60">Winner: {raid.winner} · {raid.participants} joined</p>
                    )}
                  </GlowCard>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}
