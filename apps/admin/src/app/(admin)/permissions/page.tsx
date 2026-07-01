"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

type PermissionRow = {
  id: string;
  name: string;
  category: string;
  roles: number;
};

export default function AdminPermissionsPage() {
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<PermissionRow[]>("/api/admin/permissions").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load permissions");
      setLoading(false);
    });
  }, []);

  const categories = new Set(rows.map((p) => p.category)).size;

  return (
    <AdminPageShell
      title="Permissions"
      subtitle="Granular access control for admin features"
      action={<PortalButton variant="gold" size="sm">+ Add Permission</PortalButton>}
      stats={[
        { label: "Total Permissions", value: rows.length, icon: "🔑" },
        { label: "Categories", value: categories, icon: "📁", glow: "gold" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading permissions...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No permissions in database.</p>}

      <AdminTable
        headers={["ID", "Permission", "Category", "Assigned Roles", "Actions"]}
        rows={rows.map((p) => [
          p.id.slice(-6),
          <code key={`code-${p.id}`} className="text-purple-300">{p.name}</code>,
          p.category,
          p.roles,
          <PortalButton key={`btn-${p.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
