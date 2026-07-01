"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

type LevelRow = {
  id: string;
  level: number;
  title: string;
  xpRequired: number;
  reward: string;
};

export default function AdminLevelsPage() {
  const [rows, setRows] = useState<LevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<LevelRow[]>("/api/admin/levels").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load levels");
      setLoading(false);
    });
  }, []);

  const maxLevel = rows.reduce((m, l) => Math.max(m, l.level), 0);

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
        { label: "Total Levels", value: rows.length, icon: "⚡" },
        { label: "Max Level", value: maxLevel, icon: "👑", glow: "gold" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading levels...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No levels in database.</p>}

      <AdminTable
        headers={["ID", "Level", "Title", "XP Required", "Reward", "Actions"]}
        rows={rows.map((l) => [
          l.id.slice(-6),
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
