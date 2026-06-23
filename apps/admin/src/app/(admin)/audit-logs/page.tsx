"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { ADMIN_AUDIT_LOGS } from "@/lib/mock-data";

export default function AdminAuditLogsPage() {
  return (
    <AdminPageShell
      title="Audit Logs"
      subtitle="Track all admin actions and system events"
      stats={[
        { label: "Events Today", value: ADMIN_AUDIT_LOGS.length, icon: "📋", glow: "gold" },
        { label: "Admin Actions", value: 3, icon: "🛡️" },
        { label: "System Events", value: 1, icon: "⚙️" },
        { label: "Retention", value: "90 days", icon: "📅" },
      ]}
    >
      <AdminTable
        headers={["ID", "Action", "Actor", "Target", "Timestamp"]}
        rows={ADMIN_AUDIT_LOGS.map((l) => [
          l.id,
          l.action,
          l.actor,
          l.target,
          l.time,
        ])}
      />
    </AdminPageShell>
  );
}
