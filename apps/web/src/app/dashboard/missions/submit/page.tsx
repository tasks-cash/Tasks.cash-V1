"use client";

import { useEffect, useState } from "react";
import { GlassCard, PortalButton, Input, Label, Badge } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { apiFetch } from "@/lib/api";

type MissionRow = {
  _id: string;
  title: string;
  category?: string;
  coinReward?: number;
  completed?: boolean;
};

export default function SubmitProofPage() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<MissionRow[]>("/api/missions").then((res) => {
      if (res.success && res.data) {
        setMissions(res.data);
        setSelected(res.data[0]?._id ?? "");
        setError("");
      } else {
        setMissions([]);
        setError(res.error ?? "Failed to load missions");
      }
      setLoading(false);
    });
  }, []);

  return (
    <DashboardPageShell title="Submit Proof" subtitle="Upload verification for mission completion">
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading missions...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <div className="max-w-2xl">
        <GlassCard className="p-6 mb-6">
          <h2 className="font-bold text-white mb-4">Select Mission</h2>
          {!loading && missions.length === 0 && !error && (
            <p className="text-purple-400/60 text-sm">No missions available to submit proof for.</p>
          )}
          <div className="space-y-2">
            {missions.map((m) => (
              <button
                key={m._id}
                type="button"
                onClick={() => setSelected(m._id)}
                className={`w-full text-left rounded-xl p-4 border transition-all ${selected === m._id ? "border-purple-400/50 bg-purple-900/30" : "border-purple-500/20 hover:border-purple-400/30"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{m.title}</span>
                  <Badge variant={m.completed ? "gold" : "default"}>{m.completed ? "completed" : "available"}</Badge>
                </div>
                <p className="text-xs text-purple-400/60 mt-1">{m.category ?? "general"} · {m.coinReward ?? 0} coins</p>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="proof-url">Proof URL or Link</Label>
              <Input id="proof-url" placeholder="https://..." className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea id="notes" rows={3} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm resize-none" placeholder="Additional context for reviewers..." />
            </div>
            <PortalButton variant="gold" className="w-full" disabled={!selected}>Submit for Review</PortalButton>
            <p className="text-xs text-purple-400/50 text-center">Reviews typically complete within 24 hours</p>
          </form>
        </GlassCard>
      </div>
    </DashboardPageShell>
  );
}
