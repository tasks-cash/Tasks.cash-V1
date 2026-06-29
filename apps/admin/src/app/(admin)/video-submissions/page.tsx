"use client";

import { useEffect, useState } from "react";
import type { IVideoSubmission } from "@tasks-cash/types";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";
import { platformLabel, STATUS_LABELS } from "@/lib/video-utils";

export default function AdminVideoSubmissionsPage() {
  const [items, setItems] = useState<IVideoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    const res = await adminFetch<IVideoSubmission[]>("/api/admin/video-submissions");
    if (res.success && res.data) setItems(res.data);
    else setError(res.error ?? "Failed to load video submissions");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    setMessage("");
    const res = await adminFetch(`/api/admin/video-submissions/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({
        adminResponse: reviewNotes[id] || "Approved for Video Hunter rewards.",
        rewardXp: 250,
        goldCoins: 50,
        silverCoins: 100,
      }),
    });
    setBusyId(null);
    if (res.success) {
      setMessage("Submission approved.");
      await load();
    } else {
      setError(res.error ?? "Approve failed");
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setMessage("");
    const note = reviewNotes[id]?.trim();
    if (!note) {
      setError("Add a rejection note before rejecting.");
      setBusyId(null);
      return;
    }
    const res = await adminFetch(`/api/admin/video-submissions/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ adminResponse: note }),
    });
    setBusyId(null);
    if (res.success) {
      setMessage("Submission rejected.");
      await load();
    } else {
      setError(res.error ?? "Reject failed");
    }
  }

  const pending = items.filter((i) => i.status === "pending").length;

  return (
    <AdminPageShell
      title="Video Review"
      subtitle="Approve or reject Video Hunter submissions"
      stats={[
        { label: "Total Submissions", value: items.length, icon: "🎥" },
        { label: "Pending Review", value: pending, icon: "⏳" },
        { label: "Approved", value: items.filter((i) => i.status === "approved" || i.status === "rewarded").length, icon: "✅" },
        { label: "Rejected", value: items.filter((i) => i.status === "rejected").length, icon: "✕" },
      ]}
    >
      {loading && <p className="text-purple-400/50 text-sm mb-4">Loading submissions...</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {message && <p className="text-emerald-400 text-sm mb-4">{message}</p>}

      <div className="space-y-4">
        {items.length === 0 && !loading ? (
          <GlassCard className="p-6 text-purple-400/50">No video submissions yet.</GlassCard>
        ) : (
          items.map((item) => {
            const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.pending;
            return (
              <GlassCard key={item.id} className="p-6">
                <div className="flex flex-wrap justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-white">{platformLabel(item.platform)}</p>
                    <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-sm text-violet-300 break-all hover:text-amber-300">
                      {item.videoUrl}
                    </a>
                  </div>
                  <span className={`text-xs font-bold uppercase ${status.className}`}>{status.label}</span>
                </div>
                <p className="text-sm text-purple-300/60 mb-3">
                  Views: {item.visibleViews.toLocaleString()} · Submitted: {new Date(item.submittedAt).toLocaleString()}
                </p>
                {item.adminResponse && <p className="text-sm text-purple-200/80 mb-3">Note: {item.adminResponse}</p>}

                {item.status === "pending" && (
                  <div className="space-y-3 border-t border-purple-500/10 pt-4">
                    <div>
                      <Label htmlFor={`note-${item.id}`}>Admin response</Label>
                      <Input
                        id={`note-${item.id}`}
                        className="mt-1"
                        value={reviewNotes[item.id] ?? ""}
                        onChange={(e) => setReviewNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Review note for the explorer"
                      />
                    </div>
                    <div className="flex gap-2">
                      <PortalButton variant="gold" size="sm" disabled={busyId === item.id} onClick={() => approve(item.id)}>
                        Approve
                      </PortalButton>
                      <PortalButton variant="secondary" size="sm" disabled={busyId === item.id} onClick={() => reject(item.id)}>
                        Reject
                      </PortalButton>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>
    </AdminPageShell>
  );
}
