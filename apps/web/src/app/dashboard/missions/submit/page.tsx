"use client";

import { useState } from "react";
import { GlassCard, PortalButton, Input, Label, Badge } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_MISSIONS } from "@/lib/page-data";

export default function SubmitProofPage() {
  const [selected, setSelected] = useState(DASHBOARD_MISSIONS[0]?.id ?? "");
  const activeMissions = DASHBOARD_MISSIONS.filter((m) => m.status === "active" || m.status === "completed");

  return (
    <DashboardPageShell title="Submit Proof" subtitle="Upload verification for mission completion">
      <div className="max-w-2xl">
        <GlassCard className="p-6 mb-6">
          <h2 className="font-bold text-white mb-4">Select Mission</h2>
          <div className="space-y-2">
            {activeMissions.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                className={`w-full text-left rounded-xl p-4 border transition-all ${selected === m.id ? "border-purple-400/50 bg-purple-900/30" : "border-purple-500/20 hover:border-purple-400/30"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{m.title}</span>
                  <Badge variant={m.status === "completed" ? "gold" : "default"}>{m.status}</Badge>
                </div>
                <p className="text-xs text-purple-400/60 mt-1">{m.world} · {m.reward}</p>
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
            <div>
              <Label>Upload Screenshot</Label>
              <div className="mt-2 border-2 border-dashed border-purple-500/30 rounded-xl p-8 text-center hover:border-purple-400/50 transition-colors cursor-pointer">
                <span className="text-3xl">📸</span>
                <p className="text-sm text-purple-300/60 mt-2">Drop file here or click to browse</p>
                <p className="text-xs text-purple-400/40 mt-1">PNG, JPG up to 10MB</p>
              </div>
            </div>
            <PortalButton variant="gold" className="w-full">Submit for Review</PortalButton>
            <p className="text-xs text-purple-400/50 text-center">Reviews typically complete within 24 hours</p>
          </form>
        </GlassCard>
      </div>
    </DashboardPageShell>
  );
}
