"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { adminFetch } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  active: "text-green-400",
  completed: "text-purple-400",
};

type LeaderboardRow = {
  id: string;
  season: string;
  leader: string;
  participants: number;
  status: string;
};

export default function AdminLeaderboardsPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<LeaderboardRow[]>("/api/admin/leaderboards").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load leaderboards");
      setLoading(false);
    });
  }, []);

  const active = rows.find((lb) => lb.status === "active");

  return (
    <AdminPageShell
      title="Leaderboards"
      subtitle="Manage seasons and ranking competitions"
      stats={[
        { label: "Active Season", value: active?.season ?? "—", icon: "🏆", glow: "gold" },
        { label: "Total Seasons", value: rows.length, icon: "👥" },
        { label: "Completed", value: rows.filter((lb) => lb.status === "completed").length, icon: "📅" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading leaderboards...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No leaderboard seasons in database.</p>}

      <AdminTable
        headers={["ID", "Season", "Leader", "Participants", "Status"]}
        rows={rows.map((lb) => [
          lb.id.slice(-6),
          lb.season,
          lb.leader,
          lb.participants.toLocaleString(),
          <span key={lb.id} className={STATUS_BADGE[lb.status] ?? "text-purple-300"}>{lb.status}</span>,
        ])}
      />
    </AdminPageShell>
  );
}
