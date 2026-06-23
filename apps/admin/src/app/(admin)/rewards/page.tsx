"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlowText, GlassCard, PortalButton } from "@tasks-cash/ui";
import { adminFetch, getToken } from "@/lib/api";

export default function AdminRewardsPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: "", description: "", type: "badge", rarity: "common", value: 1, requiredLevel: 1,
  });

  useEffect(() => {
    if (!getToken()) router.push("/");
  }, [router]);

  async function createReward(e: React.FormEvent) {
    e.preventDefault();
    await adminFetch("/api/admin/rewards", { method: "POST", body: JSON.stringify(rewardForm) });
    setShowForm(false);
    setRewardForm({ name: "", description: "", type: "badge", rarity: "common", value: 1, requiredLevel: 1 });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <GlowText as="h1" variant="gold" className="text-3xl">Rewards Vault</GlowText>
        <PortalButton variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Reward"}
        </PortalButton>
      </div>

      <GlassCard className="p-6">
        {showForm ? (
          <form onSubmit={createReward} className="space-y-3">
            <input placeholder="Name" value={rewardForm.name} onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })} required className="w-full rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm" />
            <textarea placeholder="Description" value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} required className="w-full rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm h-20" />
            <div className="grid grid-cols-2 gap-3">
              <select value={rewardForm.type} onChange={(e) => setRewardForm({ ...rewardForm, type: e.target.value })} className="rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm">
                <option value="coins">Coins</option>
                <option value="xp">XP</option>
                <option value="badge">Badge</option>
                <option value="item">Item</option>
                <option value="multiplier">Multiplier</option>
              </select>
              <select value={rewardForm.rarity} onChange={(e) => setRewardForm({ ...rewardForm, rarity: e.target.value })} className="rounded-lg border border-purple-500/30 bg-purple-950/50 px-3 py-2 text-white text-sm">
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
            <PortalButton type="submit" variant="primary" size="sm" className="w-full">Add to Vault</PortalButton>
          </form>
        ) : (
          <p className="text-purple-400/60 text-sm text-center py-12">
            Configure rewards that warriors can unlock in the vault.
          </p>
        )}
      </GlassCard>
    </div>
  );
}
