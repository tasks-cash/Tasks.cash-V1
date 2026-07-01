"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  delivered: "text-green-400",
  pending: "text-amber-400",
};

type NotificationRow = {
  id: string;
  title: string;
  audience: string;
  sent: string;
  status: string;
};

export default function AdminNotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<NotificationRow[]>("/api/admin/notifications").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load notifications");
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell
      title="Notifications"
      subtitle="Send platform-wide alerts and announcements"
      action={<PortalButton variant="gold" size="sm">+ Send Notification</PortalButton>}
      stats={[
        { label: "Total", value: rows.length, icon: "📤", glow: "gold" },
        { label: "Delivered", value: rows.filter((n) => n.status === "delivered").length, icon: "✅" },
        { label: "Pending", value: rows.filter((n) => n.status === "pending").length, icon: "📅" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading notifications...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No notifications in database.</p>}

      <AdminTable
        headers={["ID", "Title", "Audience", "Sent", "Status", "Actions"]}
        rows={rows.map((n) => [
          n.id.slice(-6),
          n.title,
          n.audience,
          n.sent,
          <span key={n.id} className={STATUS_BADGE[n.status] ?? "text-purple-300"}>{n.status}</span>,
          <PortalButton key={`btn-${n.id}`} variant="ghost" size="sm">View</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
