"use client";

import { useEffect, useState } from "react";
import { GlassCard, PortalButton, Input, Label, StatWidget } from "@tasks-cash/ui";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { apiFetch } from "@/lib/api";

type TicketRow = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  updated?: string;
};

const STATUS_COLOR: Record<string, string> = {
  open: "text-amber-400",
  resolved: "text-green-400",
};

const PRIORITY_COLOR: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-purple-400",
  normal: "text-purple-400",
};

export default function SupportPage() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<TicketRow[]>("/api/support").then((res) => {
      if (res.success && res.data) {
        setRows(res.data);
        setError("");
      } else {
        setRows([]);
        setError(res.error ?? "Failed to load support tickets");
      }
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await apiFetch<TicketRow>("/api/support", {
      method: "POST",
      body: JSON.stringify({ subject, message, priority }),
    });
    setSubmitting(false);
    if (res.success && res.data) {
      setRows((prev) => [res.data!, ...prev]);
      setSubject("");
      setMessage("");
      setShowForm(false);
      setError("");
    } else {
      setError(res.error ?? "Failed to create ticket");
    }
  }

  return (
    <DashboardPageShell
      title="Support Tickets"
      subtitle="Get help from the portal support council"
      action={<PortalButton variant="gold" size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "New Ticket"}</PortalButton>}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading tickets...</p>}
      {error && <p className="text-amber-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatWidget label="Open Tickets" value={rows.filter((t) => t.status === "open").length} icon="📬" glow="gold" />
        <StatWidget label="Resolved" value={rows.filter((t) => t.status === "resolved").length} icon="✅" />
        <StatWidget label="Total" value={rows.length} icon="⏱️" />
      </div>

      {showForm && (
        <GlassCard className="p-6 mb-8">
          <h2 className="font-bold text-white mb-4">Create Ticket</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description" className="mt-1 border-purple-500/20 bg-purple-950/30" required />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm">
                <option value="low">Low</option>
                <option value="normal">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea id="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm resize-none" placeholder="Describe your issue..." required />
            </div>
            <PortalButton variant="gold" disabled={submitting}>{submitting ? "Submitting..." : "Submit Ticket"}</PortalButton>
          </form>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <h2 className="font-bold text-white mb-4">Your Tickets</h2>
        {!loading && rows.length === 0 && !error && (
          <p className="text-purple-400/60 text-sm">No support tickets yet.</p>
        )}
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
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-purple-500/10 hover:bg-purple-950/20">
                  <td className="py-3 pr-4 text-purple-300">{t.id.slice(-6)}</td>
                  <td className="py-3 pr-4 text-white">{t.subject}</td>
                  <td className={`py-3 pr-4 capitalize ${PRIORITY_COLOR[t.priority] ?? "text-purple-300"}`}>{t.priority}</td>
                  <td className={`py-3 pr-4 capitalize ${STATUS_COLOR[t.status] ?? "text-purple-300"}`}>{t.status}</td>
                  <td className="py-3 text-purple-400/60">{t.updated ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </DashboardPageShell>
  );
}
