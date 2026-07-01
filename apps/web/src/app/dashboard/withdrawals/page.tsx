"use client";

import { useEffect, useState } from "react";
import { GlassCard, PortalButton, Input, Label, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { apiFetch } from "@/lib/api";

type WithdrawalRow = {
  id: string;
  amount: number;
  status: string;
  method: string;
  createdAt?: string;
};

const STATUS_COLOR: Record<string, string> = {
  completed: "text-green-400",
  pending: "text-amber-400",
  processing: "text-blue-400",
};

export default function WithdrawalsPage() {
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<WithdrawalRow[]>("/api/withdrawals").then((res) => {
      if (res.success && res.data) {
        setRows(res.data);
        setError("");
      } else {
        setRows([]);
        setError(res.error ?? "Failed to load withdrawals");
      }
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiFetch<WithdrawalRow>("/api/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount: Number(amount), method }),
    });
    setSubmitting(false);
    if (res.success && res.data) {
      setRows((prev) => [res.data!, ...prev]);
      setAmount("");
      setError("");
    } else {
      setError(res.error ?? "Failed to submit withdrawal");
    }
  }

  const totalWithdrawn = rows.filter((w) => w.status === "completed").reduce((s, w) => s + w.amount, 0);

  return (
    <DashboardPageShell title="Withdrawals" subtitle="Transfer portal coins to external wallets">
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading withdrawals...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="p-6">
          <h2 className="font-bold text-white mb-4">Request Withdrawal</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="amount">Amount (◈)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Min 100" className="mt-1 border-purple-500/20 bg-purple-950/30" required />
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <select id="method" value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm">
                <option value="crypto">Crypto Wallet</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
            <PortalButton variant="gold" className="w-full" disabled={submitting}>{submitting ? "Submitting..." : "Submit Withdrawal"}</PortalButton>
          </form>
        </GlassCard>

        <div>
          <StatWidget label="Total Withdrawn" value={`${totalWithdrawn.toLocaleString()} ◈`} icon="💸" glow="gold" />
          <GlassCard className="p-6 mt-6">
            <h2 className="font-bold text-white mb-4">Withdrawal History</h2>
            {!loading && rows.length === 0 && !error && (
              <p className="text-purple-400/60 text-sm">No withdrawals yet.</p>
            )}
            {rows.map((w) => (
              <div key={w.id} className="flex justify-between items-center py-3 border-b border-purple-500/10 last:border-0">
                <div>
                  <p className="text-white font-medium">{w.amount} ◈</p>
                  <p className="text-xs text-purple-400/50">{w.method} · {w.createdAt?.slice(0, 10) ?? ""}</p>
                </div>
                <span className={`text-sm capitalize ${STATUS_COLOR[w.status] ?? "text-purple-300"}`}>{w.status}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
