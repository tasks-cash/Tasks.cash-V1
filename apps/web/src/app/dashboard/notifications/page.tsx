"use client";

import { useEffect, useState } from "react";
import { GlassCard, PortalButton, StatWidget, Badge } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { apiFetch } from "@/lib/api";

type NotificationRow = {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  type?: string;
  createdAt?: string;
};

function formatTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours || 1}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ notifications: NotificationRow[] }>("/api/notifications").then((res) => {
      if (res.success && res.data?.notifications) {
        setRows(res.data.notifications);
        setError("");
      } else {
        setRows([]);
        setError(res.error ?? "Failed to load notifications");
      }
      setLoading(false);
    });
  }, []);

  const unread = rows.filter((n) => !n.read).length;

  return (
    <DashboardPageShell
      title="Notifications"
      subtitle="Alerts, updates, and portal intel"
      action={<PortalButton variant="ghost" size="sm">Mark All Read</PortalButton>}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading notifications...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatWidget label="Unread" value={unread} icon="🔔" glow="gold" />
        <StatWidget label="Total" value={rows.length} icon="📬" />
      </div>

      {!loading && rows.length === 0 && !error && (
        <GlassCard className="p-8 text-center text-purple-400/60">No notifications yet.</GlassCard>
      )}

      <div className="space-y-3">
        {rows.map((n) => (
          <GlassCard key={n._id} className={`p-5 ${!n.read ? "border-purple-400/30" : "opacity-80"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{n.title}</h3>
                  {!n.read && <Badge variant="gold">New</Badge>}
                </div>
                <p className="text-purple-300/60 text-sm">{n.message}</p>
                <p className="text-purple-500/40 text-xs mt-2">{formatTime(n.createdAt)}</p>
              </div>
              <span className="text-xl">{n.type === "level_up" ? "👑" : n.type === "mission_complete" ? "✅" : "ℹ️"}</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </DashboardPageShell>
  );
}
