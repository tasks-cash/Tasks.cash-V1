"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton, Badge } from "@tasks-cash/ui";
import { ADMIN_USERS, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminUsersPage() {
  const router = useRouter();

  return (
    <AdminPageShell
      title="Users"
      subtitle="Manage portal explorers and account settings"
      action={
        <Link href="/users/add">
          <PortalButton variant="gold" size="sm">+ Add User</PortalButton>
        </Link>
      }
      stats={[
        { label: "Total Users", value: ADMIN_USERS.length, icon: "👥" },
        { label: "Active", value: ADMIN_USERS.filter((u) => u.status === "active").length, icon: "✅", glow: "gold" },
        { label: "Suspended", value: ADMIN_USERS.filter((u) => u.status === "suspended").length, icon: "⚠️" },
        { label: "Avg Level", value: 35, icon: "⚡" },
      ]}
    >
      <AdminTable
        headers={["ID", "Username", "Email", "Level", "Coins", "Status", "Actions"]}
        rows={ADMIN_USERS.map((u) => [
          u.id,
          u.username,
          u.email,
          u.level,
          `${u.coins.toLocaleString()} ◈`,
          <span key={u.id} className={STATUS_BADGE[u.status]}>{u.status}</span>,
          <PortalButton key={`btn-${u.id}`} variant="ghost" size="sm" onClick={() => router.push(`/users/${u.id}/edit`)}>Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
