"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import {
  MYSTERY_CATEGORY_LABELS,
  MYSTERY_UNLOCK_LABELS,
  MYSTERY_MISSION_TYPE_LABELS,
} from "@tasks-cash/types";
import type { MysteryMissionCategory, MysteryUnlockCondition, MysteryMissionType } from "@tasks-cash/types";
import { adminFetch } from "@/lib/api";

export default function AddMysteryMissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
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
      coinType: fd.get("coinType"),
      isHidden: fd.get("isHidden") === "on",
      isFeatured: fd.get("isFeatured") === "on",
      isActive: true,
      rewards: [
        { type: "xp", amount: Number(fd.get("xpReward")) },
        { type: "gold_coins", amount: Number(fd.get("coinReward")) },
      ],
    };
    const res = await adminFetch("/api/admin/mystery-missions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.success) router.push("/mystery-missions");
  }

  return (
    <AdminPageShell
      title="Create Mystery Mission"
      subtitle="Deploy a classified mission to the secret archive"
      action={
        <Link href="/mystery-missions">
          <PortalButton variant="ghost" size="sm">← Back</PortalButton>
        </Link>
      }
    >
      <GlassCard className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label htmlFor="title">Mission Title</Label><Input id="title" name="title" required className="mt-1 auth-input" /></div>
          <div><Label htmlFor="description">Description</Label><textarea id="description" name="description" required className="mt-1 auth-input min-h-[100px]" /></div>
          <div><Label htmlFor="difficulty">Difficulty</Label>
            <select id="difficulty" name="difficulty" defaultValue="medium" className="mt-1 auth-input">
              {["easy", "medium", "hard", "epic", "legendary"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><Label htmlFor="category">Category</Label>
            <select id="category" name="category" defaultValue="hidden" className="mt-1 auth-input">
              {(Object.keys(MYSTERY_CATEGORY_LABELS) as MysteryMissionCategory[]).map((k) => (
                <option key={k} value={k}>{MYSTERY_CATEGORY_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div><Label htmlFor="missionType">Mission Type</Label>
            <select id="missionType" name="missionType" defaultValue="manual_review" className="mt-1 auth-input">
              {(Object.keys(MYSTERY_MISSION_TYPE_LABELS) as MysteryMissionType[]).map((k) => (
                <option key={k} value={k}>{MYSTERY_MISSION_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div><Label htmlFor="unlockCondition">Unlock Requirement</Label>
            <select id="unlockCondition" name="unlockCondition" defaultValue="none" className="mt-1 auth-input">
              {(Object.keys(MYSTERY_UNLOCK_LABELS) as MysteryUnlockCondition[]).map((k) => (
                <option key={k} value={k}>{MYSTERY_UNLOCK_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label htmlFor="xpReward">XP Reward</Label><Input id="xpReward" name="xpReward" type="number" defaultValue={100} className="mt-1 auth-input" /></div>
            <div><Label htmlFor="coinReward">Coin Reward</Label><Input id="coinReward" name="coinReward" type="number" defaultValue={50} className="mt-1 auth-input" /></div>
          </div>
          <div><Label htmlFor="coinType">Coin Type</Label>
            <select id="coinType" name="coinType" defaultValue="gold" className="mt-1 auth-input">
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-purple-300"><input type="checkbox" name="isHidden" defaultChecked /> Hidden</label>
          <label className="flex items-center gap-2 text-sm text-purple-300"><input type="checkbox" name="isFeatured" /> Featured</label>
          <PortalButton type="submit" variant="gold" loading={loading}>Deploy Mission</PortalButton>
        </form>
      </GlassCard>
    </AdminPageShell>
  );
}
