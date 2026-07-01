"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

type AdminUser = {
  _id: string;
  username: string;
  email: string;
  level: number;
  coins: number;
  role: string;
};

const STATUS_BADGE: Record<string, string> = {
  active: "text-emerald-400",
  suspended: "text-red-400",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await adminFetch<{ users: AdminUser[]; total: number }>("/api/admin/users");
      if (res.success && res.data) {
        setUsers(res.data.users);
      } else {
        setError(res.error ?? "Failed to load users");
      }
      setLoading(false);
    }
    load();
  }, []);

  const avgLevel = users.length ? Math.round(users.reduce((s, u) => s + u.level, 0) / users.length) : 0;

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
        { label: "Total Users", value: users.length, icon: "👥" },
        { label: "Active", value: users.length, icon: "✅", glow: "gold" },
        { label: "Admins", value: users.filter((u) => u.role !== "user").length, icon: "⚠️" },
        { label: "Avg Level", value: avgLevel, icon: "⚡" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading users…</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <AdminTable
        headers={["ID", "Username", "Email", "Level", "Coins", "Role", "Actions"]}
        rows={users.map((u) => [
          u._id,
          u.username,
          u.email,
          u.level,
          `${u.coins.toLocaleString()} ◈`,
          <span key={`${u._id}-role`} className={STATUS_BADGE.active}>{u.role}</span>,
          <PortalButton key={`btn-${u._id}`} variant="ghost" size="sm" onClick={() => router.push(`/users/${u._id}/edit`)}>Edit</PortalButton>,
        ])}
      />
    </AdminPageShell>
  );
}
