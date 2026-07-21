"use client";

import { GlassCard, GlowText, StatWidget, PortalButton, Input, Label, LevelBar, NotificationItem } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <GlowText as="h1" className="text-3xl">Support Tickets</GlowText>
        <p className="text-purple-300/60 mt-1">Manage your portal journey</p>
      </div>
      <GlassCard className="p-8 max-w-xl"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><Label>Subject</Label><Input className="mt-1" placeholder="Issue summary" /></div><div><Label>Description</Label><textarea className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white min-h-[120px]" /></div><PortalButton variant="gold">Open Ticket</PortalButton></form></GlassCard>
    </div>
  );
}
