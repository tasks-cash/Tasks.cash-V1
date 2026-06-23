"use client";

import { useState } from "react";
import { GlassCard, PortalButton, Input, Label, Badge, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_WITHDRAWALS } from "@/lib/page-data";

const STATUS_COLOR: Record<string, string> = {
  completed: "text-green-400",
  pending: "text-amber-400",
  processing: "text-blue-400",
};

export default function WithdrawalsPage() {
  const [amount, setAmount] = useState("");

  return (
    <DashboardPageShell title="Withdrawals" subtitle="Transfer portal coins to external wallets">
      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="p-6">
          <h2 className="font-bold text-white mb-4">Request Withdrawal</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="amount">Amount (◈)</Label>
              <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Min 100" className="mt-1 border-purple-500/20 bg-purple-950/30" />
              <p className="text-xs text-purple-400/50 mt-1">Available: 2,450 ◈ · Min withdrawal: 100 ◈</p>
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <select id="method" className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm">
                <option>Crypto Wallet</option>
                <option>PayPal</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div>
              <Label htmlFor="address">Wallet Address / Account</Label>
              <Input id="address" placeholder="Enter destination" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <PortalButton variant="gold" className="w-full">Submit Withdrawal</PortalButton>
          </form>
        </GlassCard>

        <div>
          <StatWidget label="Total Withdrawn" value="1,000 ◈" icon="💸" glow="gold" />
          <GlassCard className="p-6 mt-6">
            <h2 className="font-bold text-white mb-4">Withdrawal History</h2>
            {DASHBOARD_WITHDRAWALS.map((w) => (
              <div key={w.id} className="flex justify-between items-center py-3 border-b border-purple-500/10 last:border-0">
                <div>
                  <p className="text-white font-medium">{w.amount} ◈</p>
                  <p className="text-xs text-purple-400/50">{w.method} · {w.date}</p>
                </div>
                <span className={`text-sm capitalize ${STATUS_COLOR[w.status]}`}>{w.status}</span>
              </div>
            ))}
          </GlassCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
