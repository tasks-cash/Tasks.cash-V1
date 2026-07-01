"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassCard, StatWidget, PortalButton, MotionReveal } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { apiFetch } from "@/lib/api";

type MissionRow = {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  coinReward?: number;
  xpReward?: number;
  completed?: boolean;
};

export default function DashboardMissionsPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<MissionRow[]>("/api/missions").then((res) => {
      if (res.success && res.data) {
        setMissions(res.data);
        setError("");
      } else {
        setMissions([]);
        setError(res.error ?? "Failed to load missions");
      }
      setLoading(false);
    });
  }, []);

  const completed = missions.filter((m) => m.completed);
  const available = missions.filter((m) => !m.completed);

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
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading missions...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Active" value={available.length} icon="⚔️" />
        <StatWidget label="Completed" value={completed.length} icon="✅" glow="gold" />
        <StatWidget label="Available" value={available.length} icon="📋" />
      </div>

      {!loading && available.length === 0 && completed.length === 0 && !error && (
        <GlassCard className="p-8 text-center text-purple-400/60">No missions available yet.</GlassCard>
      )}

      {available.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Available</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {available.map((m) => (
              <GlassCard key={m._id} className="p-6 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">{m.title}</h3>
                  <p className="text-sm text-purple-400/60">
                    {m.category ?? "general"} · {m.coinReward ?? 0} coins
                  </p>
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
            <GlassCard key={m._id} className="p-4 mb-3 flex justify-between items-center opacity-80">
              <span className="text-white">{m.title}</span>
              <span className="text-green-400 text-sm">✓ {m.coinReward ?? 0} coins</span>
            </GlassCard>
          ))}
        </section>
      )}
    </DashboardPageShell>
  );
}
