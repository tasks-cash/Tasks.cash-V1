"use client";

import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label, Switch } from "@tasks-cash/ui";

export default function AdminSettingsPage() {
  return (
    <AdminPageShell
      title="Settings"
      subtitle="Platform configuration and system preferences"
      stats={[
        { label: "Platform Version", value: "1.0.0", icon: "⚙️" },
        { label: "Maintenance", value: "Off", icon: "🔧", glow: "gold" },
        { label: "Registrations", value: "Open", icon: "👥" },
        { label: "API Status", value: "Healthy", icon: "✅" },
      ]}
    >
      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="p-6">
          <h2 className="font-bold text-white mb-6">General Settings</h2>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="site-name">Platform Name</Label>
              <Input id="site-name" defaultValue="Tasks.cash" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="support-email">Support Email</Label>
              <Input id="support-email" defaultValue="support@tasks.cash" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Maintenance Mode</p>
                <p className="text-xs text-purple-400/50">Disable public access temporarily</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">New Registrations</p>
                <p className="text-xs text-purple-400/50">Allow new explorer sign-ups</p>
              </div>
              <Switch defaultChecked />
            </div>
            <PortalButton variant="gold">Save Settings</PortalButton>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-bold text-white mb-6">Reward Configuration</h2>
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="daily-bonus">Daily Login Bonus (◈)</Label>
              <Input id="daily-bonus" type="number" defaultValue="50" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="referral-bonus">Referral Bonus (◈)</Label>
              <Input id="referral-bonus" type="number" defaultValue="500" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="min-withdrawal">Min Withdrawal (◈)</Label>
              <Input id="min-withdrawal" type="number" defaultValue="100" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="xp-per-level">XP Per Level</Label>
              <Input id="xp-per-level" type="number" defaultValue="1000" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <PortalButton variant="gold">Save Rewards</PortalButton>
          </form>
        </GlassCard>
      </div>
    </AdminPageShell>
  );
}
