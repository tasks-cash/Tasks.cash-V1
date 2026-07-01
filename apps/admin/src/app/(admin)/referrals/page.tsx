"use client";

import { useEffect, useState } from "react";
import type { IReferralRecord, ReferralStatus } from "@tasks-cash/types";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  pending: "text-amber-400",
  active: "text-emerald-400",
  rewarded: "text-green-400",
  rejected: "text-red-400",
  paid: "text-green-400",
};

export default function AdminReferralsPage() {
  const [rows, setRows] = useState<IReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await adminFetch<IReferralRecord[]>("/api/admin/referrals");
      if (res.success && res.data) {
        setRows(res.data);
      } else {
        setError(res.error ?? "Failed to load referrals");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(id: string, status: ReferralStatus) {
    setUpdatingId(id);
    const res = await adminFetch(`/api/admin/referrals/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNote: `Marked ${status} by admin` }),
    });
    setUpdatingId(null);
    if (res.success && res.data) {
      setRows((prev) => prev.map((row) => (row.id === id ? (res.data as IReferralRecord) : row)));
    } else {
      setError(res.error ?? "Failed to update referral");
    }
  }

  const pending = rows.filter((r) => r.status === "pending").length;
  const earned = rows.reduce((sum, r) => sum + (r.status === "rewarded" ? r.rewardCoins : 0), 0);

  return (
    <AdminPageShell
      title="Referrals"
      subtitle="Track referral bonuses and ally recruitment"
      stats={[
        { label: "Total Referrals", value: rows.length, icon: "🔗" },
        { label: "Bonuses Paid", value: `${earned} ◈`, icon: "💰", glow: "gold" },
        { label: "Pending", value: pending, icon: "⏳" },
        { label: "Active", value: rows.filter((r) => r.status === "active").length, icon: "👑" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading referrals...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <AdminTable
        headers={["ID", "Referrer Code", "Referred", "Reward", "Status", "Actions"]}
        rows={rows.map((r) => [
          r.id,
          r.referralCode,
          r.referredUser?.username ?? "—",
          `${r.rewardCoins} ◈`,
          <span key={`${r.id}-status`} className={STATUS_BADGE[r.status] ?? "text-purple-300"}>{r.status}</span>,
          r.status === "pending" ? (
            <div key={`${r.id}-actions`} className="flex gap-2">
              <PortalButton size="sm" disabled={updatingId === r.id} onClick={() => updateStatus(r.id, "active")}>Activate</PortalButton>
              <PortalButton size="sm" variant="secondary" disabled={updatingId === r.id} onClick={() => updateStatus(r.id, "rewarded")}>Reward</PortalButton>
            </div>
          ) : "—",
        ])}
      />
    </AdminPageShell>
  );
}
