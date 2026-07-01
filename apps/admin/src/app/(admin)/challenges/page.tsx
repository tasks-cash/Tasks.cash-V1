"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  active: "text-green-400",
  scheduled: "text-purple-400",
};

type ChallengeRow = {
  id: string;
  title: string;
  participants: number;
  status: string;
  ends: string;
};

export default function AdminChallengesPage() {
  const [rows, setRows] = useState<ChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<ChallengeRow[]>("/api/admin/challenges").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load challenges");
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell
      title="Challenges"
      subtitle="Manage timed events and competitions"
      action={<PortalButton variant="gold" size="sm">+ Add Challenge</PortalButton>}
      stats={[
        { label: "Active", value: rows.filter((c) => c.status === "active").length, icon: "🎯", glow: "gold" },
        { label: "Total", value: rows.length, icon: "👥" },
        { label: "Scheduled", value: rows.filter((c) => c.status === "scheduled").length, icon: "📅" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading challenges...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No challenges in database.</p>}

      <AdminTable
        headers={["ID", "Title", "Participants", "Status", "Ends", "Actions"]}
        rows={rows.map((c) => [
          c.id.slice(-6),
          c.title,
          c.participants.toLocaleString(),
          <span key={c.id} className={STATUS_BADGE[c.status] ?? "text-purple-300"}>{c.status}</span>,
          c.ends,
          <PortalButton key={`btn-${c.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
