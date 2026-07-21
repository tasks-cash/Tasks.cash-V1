"use client";

import { GlassCard, GlowText, StatWidget, PortalButton, Input, Label, LevelBar, NotificationItem } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <GlowText as="h1" className="text-3xl">Security Settings</GlowText>
        <p className="text-purple-300/60 mt-1">Manage your portal journey</p>
      </div>
      <GlassCard className="p-8 max-w-xl space-y-6"><div><Label>Current Password</Label><Input type="password" className="mt-1" /></div><div><Label>New Password</Label><Input type="password" className="mt-1" /></div><PortalButton variant="gold">Update Password</PortalButton><hr className="border-purple-500/20" /><p className="text-sm text-purple-300/60">Two-factor authentication — coming soon</p></GlassCard>
    </div>
  );
}
