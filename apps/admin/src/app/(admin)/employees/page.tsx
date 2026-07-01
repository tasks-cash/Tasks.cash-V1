"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  active: "text-green-400",
  inactive: "text-purple-400",
};

type EmployeeRow = {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
};

export default function AdminEmployeesPage() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<EmployeeRow[]>("/api/admin/employees").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load employees");
      setLoading(false);
    });
  }, []);

  const departments = new Set(rows.map((e) => e.department)).size;

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
        { label: "Total Staff", value: rows.length, icon: "🛡️" },
        { label: "Active", value: rows.filter((e) => e.status === "active").length, icon: "✅", glow: "gold" },
        { label: "Departments", value: departments, icon: "🏢" },
        { label: "Inactive", value: rows.filter((e) => e.status !== "active").length, icon: "⚔️" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading employees...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No employees in database.</p>}

      <AdminTable
        headers={["ID", "Name", "Role", "Department", "Status", "Actions"]}
        rows={rows.map((e) => [
          e.id.slice(-6),
          e.name,
          e.role,
          e.department,
          <span key={e.id} className={STATUS_BADGE[e.status] ?? "text-purple-300"}>{e.status}</span>,
          <PortalButton key={`btn-${e.id}`} variant="ghost" size="sm">Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
