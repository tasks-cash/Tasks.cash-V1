"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_PERMISSIONS } from "@/lib/mock-data";

export default function AdminPermissionsPage() {
  return (
    <AdminPageShell
      title="Permissions"
      subtitle="Granular access control for admin features"
      action={<PortalButton variant="gold" size="sm">+ Add Permission</PortalButton>}
      stats={[
        { label: "Total Permissions", value: ADMIN_PERMISSIONS.length, icon: "🔑" },
        { label: "Categories", value: 4, icon: "📁" },
        { label: "User Permissions", value: 2, icon: "👥" },
        { label: "System Permissions", value: 1, icon: "⚙️", glow: "gold" },
      ]}
    >
      <AdminTable
        headers={["ID", "Permission", "Category", "Assigned Roles", "Actions"]}
        rows={ADMIN_PERMISSIONS.map((p) => [
          p.id,
          <code key={`code-${p.id}`} className="text-purple-300">{p.name}</code>,
          p.category,
          p.roles,
          <PortalButton key={`btn-${p.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
