"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  open: "text-amber-400",
  resolved: "text-green-400",
};

type TicketRow = {
  id: string;
  user: string;
  subject: string;
  priority: string;
  status: string;
};

export default function AdminSupportPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<TicketRow[]>("/api/admin/support-tickets").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load support tickets");
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell
      title="Support Tickets"
      subtitle="Handle user support requests"
      stats={[
        { label: "Open", value: rows.filter((t) => t.status === "open").length, icon: "📬", glow: "gold" },
        { label: "Resolved", value: rows.filter((t) => t.status === "resolved").length, icon: "✅" },
        { label: "High Priority", value: rows.filter((t) => t.priority === "high").length, icon: "⚠️" },
        { label: "Total", value: rows.length, icon: "⏱️" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading tickets...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No support tickets.</p>}

      <AdminTable
        headers={["ID", "User", "Subject", "Priority", "Status", "Actions"]}
        rows={rows.map((t) => [
          t.id.slice(-6),
          t.user,
          t.subject,
          <span key={`p-${t.id}`} className={t.priority === "high" ? "text-red-400" : t.priority === "medium" ? "text-amber-400" : "text-purple-400"}>{t.priority}</span>,
          <span key={t.id} className={STATUS_BADGE[t.status] ?? "text-purple-300"}>{t.status}</span>,
          <PortalButton key={`btn-${t.id}`} variant="ghost" size="sm">Respond</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
