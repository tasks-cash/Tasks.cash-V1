"use client";

import { useEffect, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  pending: "text-amber-400",
  processing: "text-blue-400",
  completed: "text-green-400",
};

type WithdrawalRow = {
  id: string;
  user: string;
  amount: number;
  method: string;
  status: string;
  date: string;
};

export default function AdminWithdrawalsPage() {
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<WithdrawalRow[]>("/api/admin/withdrawals").then((res) => {
      if (res.success && res.data) setRows(res.data);
      else setError(res.error ?? "Failed to load withdrawals");
      setLoading(false);
    });
  }, []);

  const totalVolume = rows.reduce((s, w) => s + (w.amount ?? 0), 0);

  return (
    <AdminPageShell
      title="Withdrawals"
      subtitle="Review and process withdrawal requests"
      stats={[
        { label: "Pending", value: rows.filter((w) => w.status === "pending").length, icon: "⏳", glow: "gold" },
        { label: "Processing", value: rows.filter((w) => w.status === "processing").length, icon: "🔄" },
        { label: "Completed", value: rows.filter((w) => w.status === "completed").length, icon: "✅" },
        { label: "Total Volume", value: `${totalVolume.toLocaleString()} ◈`, icon: "💰" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading withdrawals...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}
      {!loading && rows.length === 0 && !error && <p className="text-purple-400/60 text-sm mb-4">No withdrawal requests.</p>}

      <AdminTable
        headers={["ID", "User", "Amount", "Method", "Status", "Date", "Actions"]}
        rows={rows.map((w) => [
          w.id.slice(-6),
          w.user,
          `${w.amount.toLocaleString()} ◈`,
          w.method,
          <span key={w.id} className={STATUS_BADGE[w.status] ?? "text-purple-300"}>{w.status}</span>,
          w.date,
          w.status === "pending" ? (
            <div key={`actions-${w.id}`} className="flex gap-2">
              <PortalButton variant="gold" size="sm">Approve</PortalButton>
              <PortalButton variant="ghost" size="sm">Reject</PortalButton>
            </div>
          ) : "—",
        ])}
      />
    </AdminPageShell>
  );
}
