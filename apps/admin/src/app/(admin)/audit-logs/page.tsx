"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { adminFetch } from "@/lib/api";

type AuditRow = {
  id: string;
  action: string;
  actor: string;
  target: string;
  time: string;
};

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<AuditRow[]>("/api/admin/audit-logs").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load audit logs");
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell
      title="Audit Logs"
      subtitle="Track all admin actions and system events"
      stats={[
        { label: "Total Events", value: rows.length, icon: "📋", glow: "gold" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading audit logs...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No audit logs in database.</p>}

      <AdminTable
        headers={["ID", "Action", "Actor", "Target", "Timestamp"]}
        rows={rows.map((l) => [
          l.id.slice(-6),
          l.action,
          l.actor,
          l.target,
          l.time,
        ])}
      />
    </AdminPageShell>
  );
}
