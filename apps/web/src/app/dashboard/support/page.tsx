"use client";

import { useState } from "react";
import { GlassCard, PortalButton, Input, Label, Badge, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { DASHBOARD_TICKETS } from "@/lib/page-data";

const STATUS_COLOR: Record<string, string> = {
  open: "text-amber-400",
  resolved: "text-green-400",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-purple-400",
};

export default function SupportPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <DashboardPageShell
      title="Support Tickets"
      subtitle="Get help from the portal support council"
      action={<PortalButton variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New Ticket"}</PortalButton>}
    >
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Open Tickets" value={DASHBOARD_TICKETS.filter((t) => t.status === "open").length} icon="📬" glow="gold" />
        <StatWidget label="Resolved" value={DASHBOARD_TICKETS.filter((t) => t.status === "resolved").length} icon="✅" />
        <StatWidget label="Avg Response" value="4h" icon="⏱️" />
      </div>

      {showForm && (
        <GlassCard className="p-6 mb-8">
          <h2 className="font-bold text-white mb-4">Create Ticket</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Brief description" className="mt-1 border-purple-500/20 bg-purple-950/30" />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea id="message" rows={4} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm resize-none" placeholder="Describe your issue..." />
            </div>
            <PortalButton variant="gold">Submit Ticket</PortalButton>
          </form>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <h2 className="font-bold text-white mb-4">Your Tickets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-purple-400/60 border-b border-purple-500/20">
                <th className="pb-3 pr-4">ID</th>
                <th className="pb-3 pr-4">Subject</th>
                <th className="pb-3 pr-4">Priority</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {DASHBOARD_TICKETS.map((t) => (
                <tr key={t.id} className="border-b border-purple-500/10 hover:bg-purple-950/20">
                  <td className="py-3 pr-4 text-purple-300">{t.id}</td>
                  <td className="py-3 pr-4 text-white">{t.subject}</td>
                  <td className={`py-3 pr-4 capitalize ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</td>
                  <td className={`py-3 pr-4 capitalize ${STATUS_COLOR[t.status]}`}>{t.status}</td>
                  <td className="py-3 text-purple-400/60">{t.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </DashboardPageShell>
  );
}
