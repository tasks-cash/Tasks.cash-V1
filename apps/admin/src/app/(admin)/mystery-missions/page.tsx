"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GlowText,
  GlassCard,
  PortalButton,
  PageHeader,
  Badge,
} from "@tasks-cash/ui";
import type { IMysteryMission, MysteryMissionCategory, MysteryUnlockCondition, MysteryMissionType } from "@tasks-cash/types";
import {
  MYSTERY_CATEGORY_LABELS,
  MYSTERY_UNLOCK_LABELS,
  MYSTERY_MISSION_TYPE_LABELS,
} from "@tasks-cash/types";
import { adminFetch, getToken } from "@/lib/api";

const EMPTY_FORM = {
  title: "",
  description: "",
  difficulty: "medium",
  category: "hidden" as MysteryMissionCategory,
  missionType: "manual_review" as MysteryMissionType,
  unlockCondition: "none" as MysteryUnlockCondition,
  xpReward: 100,
  coinReward: 50,
  coinType: "gold",
  isHidden: true,
  isFeatured: false,
  isActive: true,
  expiresAt: "",
  scheduledAt: "",
};

export default function AdminMysteryMissionsPage() {
  const router = useRouter();
  const [missions, setMissions] = useState<IMysteryMission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/"); return; }
    loadMissions();
  }, [router]);

  async function loadMissions() {
    setLoading(true);
    const res = await adminFetch<IMysteryMission[]>("/api/admin/mystery-missions");
    if (res.success && res.data) setMissions(res.data);
    setLoading(false);
  }

  async function createMission(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      xpReward: Number(form.xpReward),
      coinReward: Number(form.coinReward),
      rewards: [
        ...(Number(form.xpReward) ? [{ type: "xp", amount: Number(form.xpReward) }] : []),
        ...(Number(form.coinReward) ? [{ type: "gold_coins", amount: Number(form.coinReward) }] : []),
      ],
      expiresAt: form.expiresAt || null,
      scheduledAt: form.scheduledAt || null,
    };
    const res = await adminFetch("/api/admin/mystery-missions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.success) {
      setShowForm(false);
      setForm(EMPTY_FORM);
      loadMissions();
    }
  }

  async function toggleHidden(id: string, isHidden: boolean) {
    await adminFetch(`/api/admin/mystery-missions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isHidden: !isHidden }),
    });
    loadMissions();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await adminFetch(`/api/admin/mystery-missions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !isActive }),
    });
    loadMissions();
  }

  async function deleteMission(id: string) {
    if (!confirm("Delete this mystery mission permanently?")) return;
    await adminFetch(`/api/admin/mystery-missions/${id}`, { method: "DELETE" });
    loadMissions();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Mystery Missions Vault"
        subtitle="Create, schedule, and manage hidden archive missions"
        badge="Admin · Classified"
      />

      <div className="flex flex-wrap gap-3 mb-8">
        <PortalButton variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Create Mystery Mission"}
        </PortalButton>
        <Link href="/mystery-missions/add">
          <PortalButton variant="secondary" size="sm">Full Form →</PortalButton>
        </Link>
      </div>

      {showForm && (
        <GlassCard glow="violet" className="p-6 mb-8">
          <form onSubmit={createMission} className="grid md:grid-cols-2 gap-4">
            <input placeholder="Mission Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="auth-input md:col-span-2" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="auth-input md:col-span-2 min-h-[80px]" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MysteryMissionCategory })} className="auth-input">
              {Object.entries(MYSTERY_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.missionType} onChange={(e) => setForm({ ...form, missionType: e.target.value as MysteryMissionType })} className="auth-input">
              {Object.entries(MYSTERY_MISSION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.unlockCondition} onChange={(e) => setForm({ ...form, unlockCondition: e.target.value as MysteryUnlockCondition })} className="auth-input">
              {Object.entries(MYSTERY_UNLOCK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className="auth-input">
              {["easy", "medium", "hard", "epic", "legendary"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="number" placeholder="XP Reward" value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })} className="auth-input" />
            <input type="number" placeholder="Coin Reward" value={form.coinReward} onChange={(e) => setForm({ ...form, coinReward: Number(e.target.value) })} className="auth-input" />
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="auth-input" />
            <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="auth-input" />
            <label className="flex items-center gap-2 text-sm text-purple-300">
              <input type="checkbox" checked={form.isHidden} onChange={(e) => setForm({ ...form, isHidden: e.target.checked })} /> Hidden
            </label>
            <label className="flex items-center gap-2 text-sm text-purple-300">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
            </label>
            <PortalButton type="submit" variant="gold" className="md:col-span-2">Deploy to Archive</PortalButton>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <div className="text-center py-20 text-purple-400/50">Loading vault...</div>
      ) : missions.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <p className="text-4xl mb-4">📜</p>
          <GlowText className="text-xl mb-2">Archive Empty</GlowText>
          <p className="text-purple-400/50 text-sm">Create your first mystery mission or use seed data.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {missions.map((m) => (
            <GlassCard key={m._id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge>{MYSTERY_CATEGORY_LABELS[m.category as MysteryMissionCategory] ?? m.category}</Badge>
                    {m.isHidden && <Badge variant="gold">Hidden</Badge>}
                    {!m.isActive && <Badge>Inactive</Badge>}
                    {m.isFeatured && <Badge variant="gold">Featured</Badge>}
                  </div>
                  <h3 className="text-lg font-bold text-white">{m.title}</h3>
                  <p className="text-purple-400/50 text-sm mt-1 line-clamp-2">{m.description}</p>
                  <p className="text-xs text-purple-400/40 mt-2">
                    Unlock: {MYSTERY_UNLOCK_LABELS[m.unlockCondition as MysteryUnlockCondition] ?? m.unlockCondition}
                    · XP {m.xpReward} · ◈ {m.coinReward}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/mystery-missions/${m._id}/edit`}>
                    <PortalButton variant="secondary" size="sm">Edit</PortalButton>
                  </Link>
                  <PortalButton variant="ghost" size="sm" onClick={() => toggleHidden(m._id, m.isHidden)}>
                    {m.isHidden ? "Reveal" : "Hide"}
                  </PortalButton>
                  <PortalButton variant="ghost" size="sm" onClick={() => toggleActive(m._id, m.isActive)}>
                    {m.isActive ? "Deactivate" : "Activate"}
                  </PortalButton>
                  <PortalButton variant="ghost" size="sm" onClick={() => deleteMission(m._id)}>Delete</PortalButton>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
