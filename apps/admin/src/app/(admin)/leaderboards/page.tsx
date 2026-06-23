"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { ADMIN_LEADERBOARDS, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminLeaderboardsPage() {
  return (
    <AdminPageShell
      title="Leaderboards"
      subtitle="Manage seasons and ranking competitions"
      stats={[
        { label: "Active Season", value: "Season 4", icon: "🏆", glow: "gold" },
        { label: "Participants", value: "12,847", icon: "👥" },
        { label: "Completed Seasons", value: 3, icon: "📅" },
        { label: "Prize Pool", value: "100K ◈", icon: "💰" },
      ]}
    >
      <AdminTable
        headers={["ID", "Season", "Leader", "Participants", "Status"]}
        rows={ADMIN_LEADERBOARDS.map((lb) => [
          lb.id,
          lb.season,
          lb.leader,
          lb.participants.toLocaleString(),
          <span key={lb.id} className={STATUS_BADGE[lb.status]}>{lb.status}</span>,
        ])}
      />
    </AdminPageShell>
  );
}
