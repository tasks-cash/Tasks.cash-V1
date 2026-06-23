"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_EMPLOYEES, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminEmployeesPage() {
  const router = useRouter();

  return (
    <AdminPageShell
      title="Employees"
      subtitle="Manage staff and internal team members"
      action={
        <Link href="/employees/add">
          <PortalButton variant="gold" size="sm">+ Add Employee</PortalButton>
        </Link>
      }
      stats={[
        { label: "Total Staff", value: ADMIN_EMPLOYEES.length, icon: "🛡️" },
        { label: "Active", value: ADMIN_EMPLOYEES.filter((e) => e.status === "active").length, icon: "✅", glow: "gold" },
        { label: "Departments", value: 4, icon: "🏢" },
        { label: "Moderators", value: 2, icon: "⚔️" },
      ]}
    >
      <AdminTable
        headers={["ID", "Name", "Role", "Department", "Status", "Actions"]}
        rows={ADMIN_EMPLOYEES.map((e) => [
          e.id,
          e.name,
          e.role,
          e.department,
          <span key={e.id} className={STATUS_BADGE[e.status]}>{e.status}</span>,
          <PortalButton key={`btn-${e.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
