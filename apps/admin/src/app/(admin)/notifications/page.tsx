"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_NOTIFICATIONS, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminNotificationsPage() {
  return (
    <AdminPageShell
      title="Notifications"
      subtitle="Send platform-wide alerts and announcements"
      action={<PortalButton variant="gold" size="sm">+ Send Notification</PortalButton>}
      stats={[
        { label: "Sent Today", value: 2, icon: "📤", glow: "gold" },
        { label: "Delivered", value: ADMIN_NOTIFICATIONS.length, icon: "✅" },
        { label: "Open Rate", value: "68%", icon: "📊" },
        { label: "Scheduled", value: 0, icon: "📅" },
      ]}
    >
      <AdminTable
        headers={["ID", "Title", "Audience", "Sent", "Status", "Actions"]}
        rows={ADMIN_NOTIFICATIONS.map((n) => [
          n.id,
          n.title,
          n.audience,
          n.sent,
          <span key={n.id} className={STATUS_BADGE[n.status]}>{n.status}</span>,
          <PortalButton key={`btn-${n.id}`} variant="ghost" size="sm">View</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
