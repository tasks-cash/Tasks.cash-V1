"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_TREASURES } from "@/lib/mock-data";

export default function AdminTreasuresPage() {
  return (
    <AdminPageShell
      title="Treasures"
      subtitle="Manage collectible artifacts and drop rates"
      action={<PortalButton variant="gold" size="sm">+ Add Treasure</PortalButton>}
      stats={[
        { label: "Total Items", value: ADMIN_TREASURES.length, icon: "💎" },
        { label: "Legendary", value: 1, icon: "👑", glow: "gold" },
        { label: "Total Unlocks", value: "3,372", icon: "🔓" },
        { label: "Drop Rate Avg", value: "2.4%", icon: "📊" },
      ]}
    >
      <AdminTable
        headers={["ID", "Name", "Rarity", "Times Unlocked", "Actions"]}
        rows={ADMIN_TREASURES.map((t) => [
          t.id,
          t.name,
          <span key={`r-${t.id}`} className={t.rarity === "legendary" ? "text-amber-400" : t.rarity === "epic" ? "text-purple-400" : "text-blue-400"}>{t.rarity}</span>,
          t.unlocked.toLocaleString(),
          <PortalButton key={`btn-${t.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
