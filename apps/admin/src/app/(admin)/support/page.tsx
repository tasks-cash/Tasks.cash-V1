"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_TICKETS, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminSupportPage() {
  return (
    <AdminPageShell
      title="Support Tickets"
      subtitle="Handle user support requests"
      stats={[
        { label: "Open", value: ADMIN_TICKETS.filter((t) => t.status === "open").length, icon: "📬", glow: "gold" },
        { label: "Resolved", value: ADMIN_TICKETS.filter((t) => t.status === "resolved").length, icon: "✅" },
        { label: "High Priority", value: ADMIN_TICKETS.filter((t) => t.priority === "high").length, icon: "⚠️" },
        { label: "Avg Response", value: "4h", icon: "⏱️" },
      ]}
    >
      <AdminTable
        headers={["ID", "User", "Subject", "Priority", "Status", "Actions"]}
        rows={ADMIN_TICKETS.map((t) => [
          t.id,
          t.user,
          t.subject,
          <span key={`p-${t.id}`} className={t.priority === "high" ? "text-red-400" : t.priority === "medium" ? "text-amber-400" : "text-purple-400"}>{t.priority}</span>,
          <span key={t.id} className={STATUS_BADGE[t.status]}>{t.status}</span>,
          <PortalButton key={`btn-${t.id}`} variant="ghost" size="sm">Respond</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
