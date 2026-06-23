"use client";

import Link from "next/link";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_LEVELS } from "@/lib/mock-data";

export default function AdminLevelsPage() {
  return (
    <AdminPageShell
      title="Levels"
      subtitle="Configure XP thresholds and level rewards"
      action={
        <Link href="/levels/add">
          <PortalButton variant="gold" size="sm">+ Add Level</PortalButton>
        </Link>
      }
      stats={[
        { label: "Total Levels", value: ADMIN_LEVELS.length, icon: "⚡" },
        { label: "Max Level", value: 30, icon: "👑", glow: "gold" },
        { label: "Avg XP Required", value: "34K", icon: "📈" },
        { label: "Reward Types", value: 4, icon: "🎁" },
      ]}
    >
      <AdminTable
        headers={["ID", "Level", "Title", "XP Required", "Reward", "Actions"]}
        rows={ADMIN_LEVELS.map((l) => [
          l.id,
          l.level,
          l.title,
          l.xpRequired.toLocaleString(),
          l.reward,
          <PortalButton key={`btn-${l.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
