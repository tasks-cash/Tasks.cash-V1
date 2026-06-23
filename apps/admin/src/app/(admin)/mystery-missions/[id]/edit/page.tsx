"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import type { IMysteryMission, MysteryMissionCategory, MysteryUnlockCondition, MysteryMissionType } from "@tasks-cash/types";
import { MYSTERY_CATEGORY_LABELS, MYSTERY_UNLOCK_LABELS, MYSTERY_MISSION_TYPE_LABELS } from "@tasks-cash/types";
import { adminFetch, getToken } from "@/lib/api";

export default function EditMysteryMissionPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [mission, setMission] = useState<IMysteryMission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/"); return; }
    adminFetch<IMysteryMission[]>(`/api/admin/mystery-missions`).then((res) => {
      if (res.success && res.data) {
        const found = res.data.find((m) => m._id === id);
        if (found) setMission(found);
      }
      setLoading(false);
    });
  }, [router, id]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mission) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: fd.get("title"),
      description: fd.get("description"),
      difficulty: fd.get("difficulty"),
      category: fd.get("category"),
      missionType: fd.get("missionType"),
      unlockCondition: fd.get("unlockCondition"),
      xpReward: Number(fd.get("xpReward")),
      coinReward: Number(fd.get("coinReward")),
      isHidden: fd.get("isHidden") === "on",
      isFeatured: fd.get("isFeatured") === "on",
      isActive: fd.get("isActive") === "on",
    };
    const res = await adminFetch(`/api/admin/mystery-missions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (res.success) router.push("/mystery-missions");
  }

  if (loading) return <div className="text-purple-400/50 p-8">Loading...</div>;
  if (!mission) return <div className="text-red-400 p-8">Mission not found</div>;

  return (
    <AdminPageShell
      title="Edit Mystery Mission"
      subtitle={mission.title}
      action={
        <Link href="/mystery-missions">
          <PortalButton variant="ghost" size="sm">← Back</PortalButton>
        </Link>
      }
    >
      <GlassCard className="p-8 max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={mission.title} className="mt-1 auth-input" required /></div>
          <div><Label htmlFor="description">Description</Label><textarea id="description" name="description" defaultValue={mission.description} className="mt-1 auth-input min-h-[100px]" required /></div>
          <div><Label htmlFor="difficulty">Difficulty</Label>
            <select id="difficulty" name="difficulty" defaultValue={mission.difficulty} className="mt-1 auth-input">
              {["easy", "medium", "hard", "epic", "legendary"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><Label htmlFor="category">Category</Label>
            <select id="category" name="category" defaultValue={mission.category} className="mt-1 auth-input">
              {Object.entries(MYSTERY_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><Label htmlFor="missionType">Mission Type</Label>
            <select id="missionType" name="missionType" defaultValue={mission.missionType} className="mt-1 auth-input">
              {Object.entries(MYSTERY_MISSION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><Label htmlFor="unlockCondition">Unlock Requirement</Label>
            <select id="unlockCondition" name="unlockCondition" defaultValue={mission.unlockCondition} className="mt-1 auth-input">
              {Object.entries(MYSTERY_UNLOCK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="xpReward">XP</Label><Input id="xpReward" name="xpReward" type="number" defaultValue={mission.xpReward} className="mt-1 auth-input" /></div>
            <div><Label htmlFor="coinReward">Coins</Label><Input id="coinReward" name="coinReward" type="number" defaultValue={mission.coinReward} className="mt-1 auth-input" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-purple-300"><input type="checkbox" name="isHidden" defaultChecked={mission.isHidden} /> Hidden</label>
          <label className="flex items-center gap-2 text-sm text-purple-300"><input type="checkbox" name="isFeatured" defaultChecked={mission.isFeatured} /> Featured</label>
          <label className="flex items-center gap-2 text-sm text-purple-300"><input type="checkbox" name="isActive" defaultChecked={mission.isActive} /> Active</label>
          <PortalButton type="submit" variant="gold">Save Changes</PortalButton>
        </form>
      </GlassCard>
    </AdminPageShell>
  );
}
