"use client";

import Link from "next/link";
import { GlassCard, LevelBar, StatWidget, PortalButton, MotionReveal } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_MISSIONS } from "@/lib/page-data";

export default function DashboardMissionsPage() {
  const active = DASHBOARD_MISSIONS.filter((m) => m.status === "active");
  const completed = DASHBOARD_MISSIONS.filter((m) => m.status === "completed");
  const available = DASHBOARD_MISSIONS.filter((m) => m.status === "available");

  return (
    <DashboardPageShell
      title="My Missions"
      subtitle="Track active quests and claim completed rewards"
      action={
        <Link href="/dashboard/missions/submit">
          <PortalButton variant="gold" size="sm">Submit Proof</PortalButton>
        </Link>
      }
    >
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Active" value={active.length} icon="⚔️" />
        <StatWidget label="Completed" value={completed.length} icon="✅" glow="gold" />
        <StatWidget label="Available" value={available.length} icon="📋" />
      </div>

      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">In Progress</h2>
          <div className="space-y-4">
            {active.map((m) => (
              <MotionReveal key={m.id}>
                <GlassCard className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-white">{m.title}</h3>
                      <p className="text-sm text-purple-400/60">{m.world} · {m.difficulty}</p>
                    </div>
                    <span className="text-amber-400 font-semibold">{m.reward}</span>
                  </div>
                  <div className="h-2 rounded-full bg-purple-950/80 border border-purple-500/20 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all" style={{ width: `${m.progress}%` }} />
                  </div>
                  <p className="text-xs text-purple-400/50 mt-2">{m.progress}% complete</p>
                </GlassCard>
              </MotionReveal>
            ))}
          </div>
        </section>
      )}

      {available.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Available</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {available.map((m) => (
              <GlassCard key={m.id} className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">{m.title}</h3>
                  <p className="text-sm text-purple-400/60">{m.world} · {m.reward}</p>
                </div>
                <PortalButton variant="gold" size="sm">Accept</PortalButton>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Completed</h2>
          {completed.map((m) => (
            <GlassCard key={m.id} className="p-4 mb-3 flex justify-between items-center opacity-80">
              <span className="text-white">{m.title}</span>
              <span className="text-green-400 text-sm">✓ {m.reward}</span>
            </GlassCard>
          ))}
        </section>
      )}
    </DashboardPageShell>
  );
}
