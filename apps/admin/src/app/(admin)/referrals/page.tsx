"use client";

import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { ADMIN_REFERRALS, STATUS_BADGE } from "@/lib/mock-data";

export default function AdminReferralsPage() {
  return (
    <AdminPageShell
      title="Referrals"
      subtitle="Track referral bonuses and ally recruitment"
      stats={[
        { label: "Total Referrals", value: ADMIN_REFERRALS.length, icon: "🔗" },
        { label: "Bonuses Paid", value: "750 ◈", icon: "💰", glow: "gold" },
        { label: "Pending", value: ADMIN_REFERRALS.filter((r) => r.status === "pending").length, icon: "⏳" },
        { label: "Top Referrer", value: "VoidKing", icon: "👑" },
      ]}
    >
      <AdminTable
        headers={["ID", "Referrer", "Referred", "Bonus", "Status"]}
        rows={ADMIN_REFERRALS.map((r) => [
          r.id,
          r.referrer,
          r.referred,
          `${r.bonus} ◈`,
          <span key={r.id} className={STATUS_BADGE[r.status]}>{r.status}</span>,
        ])}
      />
    </AdminPageShell>
  );
}
