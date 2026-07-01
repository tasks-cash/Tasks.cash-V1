"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

type RoleRow = {
  id: string;
  name: string;
  permissions: number;
  users: number;
};

export default function AdminRolesPage() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<RoleRow[]>("/api/admin/roles").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load roles");
      setLoading(false);
    });
  }, []);

  return (
    <AdminPageShell
      title="Roles"
      subtitle="Manage access roles and permission groups"
      action={<PortalButton variant="gold" size="sm">+ Add Role</PortalButton>}
      stats={[
        { label: "Total Roles", value: rows.length, icon: "🔐" },
        { label: "Total Permissions", value: rows.reduce((s, r) => s + r.permissions, 0), icon: "👑", glow: "gold" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading roles...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No roles in database.</p>}

      <AdminTable
        headers={["ID", "Role Name", "Permissions", "Assigned Users", "Actions"]}
        rows={rows.map((r) => [
          r.id.slice(-6),
          r.name,
          r.permissions,
          r.users,
          <PortalButton key={`btn-${r.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
