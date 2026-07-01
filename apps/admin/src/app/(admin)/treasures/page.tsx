"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

type TreasureRow = {
  id: string;
  name: string;
  rarity: string;
  unlocked: number;
};

export default function AdminTreasuresPage() {
  const [rows, setRows] = useState<TreasureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<TreasureRow[]>("/api/admin/treasures").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load treasures");
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell
      title="Treasures"
      subtitle="Manage collectible artifacts and drop rates"
      action={<PortalButton variant="gold" size="sm">+ Add Treasure</PortalButton>}
      stats={[
        { label: "Total Items", value: rows.length, icon: "💎" },
        { label: "Legendary", value: rows.filter((t) => t.rarity === "legendary").length, icon: "👑", glow: "gold" },
        { label: "Total Unlocks", value: rows.reduce((s, t) => s + t.unlocked, 0).toLocaleString(), icon: "🔓" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading treasures...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No treasures in database.</p>}

      <AdminTable
        headers={["ID", "Name", "Rarity", "Times Unlocked", "Actions"]}
        rows={rows.map((t) => [
          t.id.slice(-6),
          t.name,
          <span key={`r-${t.id}`} className={t.rarity === "legendary" ? "text-amber-400" : t.rarity === "epic" ? "text-purple-400" : "text-blue-400"}>{t.rarity}</span>,
          t.unlocked.toLocaleString(),
          <PortalButton key={`btn-${t.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
