"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlowText, GlassCard, PortalButton } from "@tasks-cash/ui";
import { adminFetch, getToken } from "@/lib/api";

export default function AdminMissionsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [missionForm, setMissionForm] = useState({
    title: "", description: "", difficulty: "easy", coinReward: 50, xpReward: 100, category: "general",
  });

  useEffect(() => {
    if (!getToken()) router.push("/");
  }, [router]);

  async function createMission(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/api/admin/missions", { method: "POST", body: JSON.stringify(missionForm) });
    setShowForm(false);
    setMissionForm({ title: "", description: "", difficulty: "easy", coinReward: 50, xpReward: 100, category: "general" });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <GlowText as="h1" variant="gold" className="text-3xl">Mission Control</GlowText>
        <PortalButton variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Mission"}
        </PortalButton>
      </div>

      <GlassCard className="p-6">
        {showForm ? (
          <form onSubmit={createMission} className="space-y-3">
            <input placeholder="Title" value={missionForm.title} onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })} required className="w-full rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm" />
            <textarea placeholder="Description" value={missionForm.description} onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })} required className="w-full rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm h-24" />
            <select value={missionForm.difficulty} onChange={(e) => setMissionForm({ ...missionForm, difficulty: e.target.value })} className="w-full rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="legendary">Legendary</option>
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Coin Reward" value={missionForm.coinReward} onChange={(e) => setMissionForm({ ...missionForm, coinReward: Number(e.target.value) })} className="rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm" />
              <input type="number" placeholder="XP Reward" value={missionForm.xpReward} onChange={(e) => setMissionForm({ ...missionForm, xpReward: Number(e.target.value) })} className="rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm" />
            </div>
            <PortalButton type="submit" variant="primary" size="sm" className="w-full">Deploy Mission</PortalButton>
          </form>
        ) : (
          <p className="text-purple-400/60 text-sm text-center py-12">
            Create new missions for portal warriors to complete.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
