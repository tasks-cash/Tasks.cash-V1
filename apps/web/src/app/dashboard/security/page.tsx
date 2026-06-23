"use client";

import { GlassCard, PortalButton, Input, Label, Switch, Badge } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";

export default function SecurityPage() {
  return (
    <DashboardPageShell title="Security" subtitle="Protect your portal account">
      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="p-6">
          <h2 className="font-bold text-white mb-4">Change Password</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="current">Current Password</Label>
              <Input id="current" type="password" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="new">New Password</Label>
              <Input id="new" type="password" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <PortalButton variant="gold">Update Password</PortalButton>
          </form>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Two-Factor Authentication</h3>
                <p className="text-sm text-purple-400/60 mt-1">Add an extra layer of security</p>
              </div>
              <Switch />
            </div>
            <Badge variant="default" className="mt-4">Recommended</Badge>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-bold text-white mb-4">Active Sessions</h3>
            {[
              { device: "Chrome on Linux", location: "Current session", active: true },
              { device: "Safari on iPhone", location: "Last active 2d ago", active: false },
            ].map((s) => (
              <div key={s.device} className="flex justify-between items-center py-3 border-b border-purple-500/10 last:border-0">
                <div>
                  <p className="text-white text-sm">{s.device}</p>
                  <p className="text-xs text-purple-400/50">{s.location}</p>
                </div>
                {s.active ? <Badge variant="gold">Active</Badge> : <PortalButton variant="ghost" size="sm">Revoke</PortalButton>}
              </div>
            ))}
          </GlassCard>

          <GlassCard className="p-6 border-red-500/20">
            <h3 className="font-bold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-sm text-purple-400/60 mb-4">Permanently delete your account and all data.</p>
            <PortalButton variant="ghost" size="sm" className="text-red-400 border-red-500/30">Delete Account</PortalButton>
          </GlassCard>
        </div>
      </div>
    </DashboardPageShell>
  );
}
