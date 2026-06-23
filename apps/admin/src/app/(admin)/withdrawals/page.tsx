"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { ADMIN_WITHDRAWALS, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminWithdrawalsPage() {
  return (
    <AdminPageShell
      title="Withdrawals"
      subtitle="Review and process withdrawal requests"
      stats={[
        { label: "Pending", value: ADMIN_WITHDRAWALS.filter((w) => w.status === "pending").length, icon: "⏳", glow: "gold" },
        { label: "Processing", value: ADMIN_WITHDRAWALS.filter((w) => w.status === "processing").length, icon: "🔄" },
        { label: "Completed", value: ADMIN_WITHDRAWALS.filter((w) => w.status === "completed").length, icon: "✅" },
        { label: "Total Volume", value: "8,500 ◈", icon: "💰" },
      ]}
    >
      <AdminTable
        headers={["ID", "User", "Amount", "Method", "Status", "Date", "Actions"]}
        rows={ADMIN_WITHDRAWALS.map((w) => [
          w.id,
          w.user,
          `${w.amount.toLocaleString()} ◈`,
          w.method,
          <span key={w.id} className={STATUS_BADGE[w.status]}>{w.status}</span>,
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
