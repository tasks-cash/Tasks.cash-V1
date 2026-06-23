"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_CHALLENGES, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminChallengesPage() {
  return (
    <AdminPageShell
      title="Challenges"
      subtitle="Manage timed events and competitions"
      action={<PortalButton variant="gold" size="sm">+ Add Challenge</PortalButton>}
      stats={[
        { label: "Active", value: ADMIN_CHALLENGES.filter((c) => c.status === "active").length, icon: "🎯", glow: "gold" },
        { label: "Participants", value: "23.5K", icon: "👥" },
        { label: "Scheduled", value: 1, icon: "📅" },
        { label: "Prize Pool", value: "500K ◈", icon: "💰" },
      ]}
    >
      <AdminTable
        headers={["ID", "Title", "Participants", "Status", "Ends", "Actions"]}
        rows={ADMIN_CHALLENGES.map((c) => [
          c.id,
          c.title,
          c.participants.toLocaleString(),
          <span key={c.id} className={STATUS_BADGE[c.status]}>{c.status}</span>,
          c.ends,
          <PortalButton key={`btn-${c.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
