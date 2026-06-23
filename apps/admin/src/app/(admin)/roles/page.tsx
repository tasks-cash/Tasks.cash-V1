"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_ROLES } from "@/lib/mock-data";

export default function AdminRolesPage() {
  return (
    <AdminPageShell
      title="Roles"
      subtitle="Manage access roles and permission groups"
      action={<PortalButton variant="gold" size="sm">+ Add Role</PortalButton>}
      stats={[
        { label: "Total Roles", value: ADMIN_ROLES.length, icon: "🔐" },
        { label: "Super Admins", value: 2, icon: "👑", glow: "gold" },
        { label: "Moderators", value: 5, icon: "🛡️" },
        { label: "Support Agents", value: 8, icon: "💬" },
      ]}
    >
      <AdminTable
        headers={["ID", "Role Name", "Permissions", "Assigned Users", "Actions"]}
        rows={ADMIN_ROLES.map((r) => [
          r.id,
          r.name,
          r.permissions,
          r.users,
          <PortalButton key={`btn-${r.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
