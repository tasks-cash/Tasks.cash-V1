"use client";

import { GlassCard, GlowText, StatWidget, PortalButton, Input, Label, LevelBar, NotificationItem } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <GlowText as="h1" className="text-3xl">Withdrawals</GlowText>
        <p className="text-purple-300/60 mt-1">Manage your portal journey</p>
      </div>
      <GlassCard className="p-8 max-w-xl"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><Label>Amount (coins)</Label><Input type="number" className="mt-1" placeholder="500" /></div><div><Label>Payment Method</Label><Input className="mt-1" placeholder="PayPal / Crypto wallet" /></div><PortalButton variant="gold">Request Withdrawal</PortalButton></form></GlassCard>
    </div>
  );
}
