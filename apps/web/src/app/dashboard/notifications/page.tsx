"use client";

import { GlassCard, PortalButton, StatWidget, Badge } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_NOTIFICATIONS } from "@/lib/page-data";

export default function NotificationsPage() {
  const unread = DASHBOARD_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <DashboardPageShell
      title="Notifications"
      subtitle="Alerts, updates, and portal intel"
      action={<PortalButton variant="ghost" size="sm">Mark All Read</PortalButton>}
    >
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatWidget label="Unread" value={unread} icon="🔔" glow="gold" />
        <StatWidget label="Total" value={DASHBOARD_NOTIFICATIONS.length} icon="📬" />
      </div>

      <div className="space-y-3">
        {DASHBOARD_NOTIFICATIONS.map((n) => (
          <GlassCard key={n.id} className={`p-5 ${!n.read ? "border-purple-400/30" : "opacity-80"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{n.title}</h3>
                  {!n.read && <Badge variant="gold">New</Badge>}
                </div>
                <p className="text-purple-300/60 text-sm">{n.message}</p>
                <p className="text-purple-500/40 text-xs mt-2">{n.time}</p>
              </div>
              <span className="text-xl">{n.type === "gold" ? "👑" : n.type === "success" ? "✅" : "ℹ️"}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </DashboardPageShell>
  );
}
