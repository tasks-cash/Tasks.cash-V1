"use client";

import { useEffect, useState } from "react";
import type { IReferralRecord, ReferralStatus } from "@tasks-cash/types";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";
import { ADMIN_REFERRALS, STATUS_BADGE } from "@/lib/mock-data";

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
        setRows(
          ADMIN_REFERRALS.map((r) => ({
            id: r.id,
            referrerId: "mock",
            referredUserId: "mock",
            referralCode: "VOID-7X9K",
            status: (r.status === "paid" ? "rewarded" : r.status) as ReferralStatus,
            rewardXp: 100,
            rewardCoins: r.bonus,
            createdAt: "2026-06-01T00:00:00.000Z",
            referredUser: { id: "mock", username: r.referred, createdAt: "2026-06-01T00:00:00.000Z" },
          }))
        );
        if (res.error) setError(`${res.error} — showing fallback data`);
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
          <span key={`${r.id}-status`} className={STATUS_BADGE[r.status] ?? "text-purple-300"}>
            {r.status}
          </span>,
          r.status === "pending" ? (
            <div key={`${r.id}-actions`} className="flex gap-2">
              <PortalButton size="sm" variant="gold" disabled={updatingId === r.id} onClick={() => updateStatus(r.id, "active")}>
                Activate
              </PortalButton>
              <PortalButton size="sm" variant="secondary" disabled={updatingId === r.id} onClick={() => updateStatus(r.id, "rejected")}>
                Reject
              </PortalButton>
            </div>
          ) : r.status === "active" ? (
            <PortalButton key={`${r.id}-reward`} size="sm" variant="gold" disabled={updatingId === r.id} onClick={() => updateStatus(r.id, "rewarded")}>
              Mark Rewarded
            </PortalButton>
          ) : (
            "—"
          ),
        ])}
      />
    </AdminPageShell>
  );
}
