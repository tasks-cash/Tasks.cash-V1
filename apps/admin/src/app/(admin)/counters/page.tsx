"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import type { ICountersAdminResponse, ICounterSetting } from "@tasks-cash/types";
import { adminFetch, getToken } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function AdminCountersPage() {
  const router = useRouter();
  const [data, setData] = useState<ICountersAdminResponse | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<ICounterSetting>>>({});

  const load = useCallback(async () => {
    const res = await adminFetch<ICountersAdminResponse>("/api/admin/counters");
    if (res.success && res.data) {
      setData(res.data);
      setDrafts({});
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.push("/");
      return;
    }
    void load();
    const id = setInterval(() => void load(), 3000);
    return () => clearInterval(id);
  }, [load, router]);

  const launch = async () => {
    setBusy(true);
    setMessage("");
    const res = await adminFetch<ICountersAdminResponse>("/api/admin/counters/launch", { method: "POST" });
    setBusy(false);
    setMessage(res.success ? "Counters launched — values will increase automatically." : res.error ?? "Launch failed.");
    if (res.success && res.data) setData(res.data);
  };

  const stop = async () => {
    setBusy(true);
    setMessage("");
    const res = await adminFetch<ICountersAdminResponse>("/api/admin/counters/stop", { method: "POST" });
    setBusy(false);
    setMessage(res.success ? "Counters stopped." : res.error ?? "Stop failed.");
    if (res.success && res.data) setData(res.data);
  };

  const saveCounter = async (key: string) => {
    const patch = drafts[key];
    if (!patch) return;
    setBusy(true);
    const res = await adminFetch<ICountersAdminResponse>(`/api/admin/counters/${key}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setBusy(false);
    setMessage(res.success ? `Updated ${key}.` : res.error ?? "Update failed.");
    if (res.success && res.data) {
      setData(res.data);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const patchDraft = (key: string, field: keyof ICounterSetting, value: number | boolean) => {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const getField = (counter: ICounterSetting, field: keyof ICounterSetting) => {
    const draft = drafts[counter.key];
    if (draft && field in draft) return draft[field as keyof typeof draft];
    return counter[field];
  };

  if (!data) {
    return (
      <AdminPageShell title="Live Counters" subtitle="Loading counter settings…">
        <p className="text-purple-300/60">Loading…</p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="Live Counters"
      subtitle="Control all public platform statistics — launch, stop, and edit increment speeds."
      stats={[
        { label: "Status", value: data.isRunning ? "Active" : "Stopped", icon: data.isRunning ? "🟢" : "⏸️", glow: data.isRunning ? "gold" : "purple" },
        { label: "Counters", value: data.counters.length, icon: "📊" },
        { label: "Total Users", value: data.counters.find((c) => c.key === "total_users")?.value ?? 0, icon: "👥", glow: "purple" },
        { label: "Videos Submitted", value: data.counters.find((c) => c.key === "videos_submitted")?.value ?? 0, icon: "🎥", glow: "gold" },
      ]}
    >
      {message && <p className="mb-4 text-sm text-amber-300">{message}</p>}

      <GlassCard className="p-6 mb-8 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <p className="text-white font-bold text-lg mb-1">
            System Status: {data.isRunning ? "Active — counters increasing" : "Stopped — all values frozen"}
          </p>
          <p className="text-purple-400/50 text-sm">
            Initial state is 0 for all counters. Launch to start automatic increments on the frontend.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PortalButton variant="gold" size="md" onClick={launch} disabled={busy || data.isRunning}>
            Launch Counters · زر الانطلاق
          </PortalButton>
          <PortalButton variant="secondary" size="md" onClick={stop} disabled={busy || !data.isRunning}>
            Stop Counters
          </PortalButton>
        </div>
      </GlassCard>

      <div className="space-y-4">
        {data.counters.map((counter) => (
          <GlassCard key={counter.key} className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-purple-400/50">{counter.key}</p>
                <h3 className="text-lg font-bold text-white">{counter.label}</h3>
                <p className="text-2xl font-black text-amber-400 mt-1">{counter.value.toLocaleString()}</p>
                <p className="text-xs text-purple-400/40 mt-1">
                  {counter.isActive ? "Active" : "Inactive"} · Updated {new Date(counter.lastUpdatedAt).toLocaleString()}
                </p>
              </div>
              <PortalButton variant="secondary" size="sm" onClick={() => saveCounter(counter.key)} disabled={busy || !drafts[counter.key]}>
                Save Changes
              </PortalButton>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor={`${counter.key}-value`}>Value</Label>
                <Input
                  id={`${counter.key}-value`}
                  type="number"
                  min={0}
                  value={Number(getField(counter, "value"))}
                  onChange={(e) => patchDraft(counter.key, "value", Number(e.target.value))}
                  className="mt-1 border-purple-500/20 bg-purple-950/30"
                />
              </div>
              <div>
                <Label htmlFor={`${counter.key}-min`}>Increment Min</Label>
                <Input
                  id={`${counter.key}-min`}
                  type="number"
                  min={0}
                  value={Number(getField(counter, "incrementMin"))}
                  onChange={(e) => patchDraft(counter.key, "incrementMin", Number(e.target.value))}
                  className="mt-1 border-purple-500/20 bg-purple-950/30"
                />
              </div>
              <div>
                <Label htmlFor={`${counter.key}-max`}>Increment Max</Label>
                <Input
                  id={`${counter.key}-max`}
                  type="number"
                  min={0}
                  value={Number(getField(counter, "incrementMax"))}
                  onChange={(e) => patchDraft(counter.key, "incrementMax", Number(e.target.value))}
                  className="mt-1 border-purple-500/20 bg-purple-950/30"
                />
              </div>
              <div>
                <Label htmlFor={`${counter.key}-interval`}>Interval (seconds)</Label>
                <Input
                  id={`${counter.key}-interval`}
                  type="number"
                  min={1}
                  value={Number(getField(counter, "intervalSeconds"))}
                  onChange={(e) => patchDraft(counter.key, "intervalSeconds", Number(e.target.value))}
                  className="mt-1 border-purple-500/20 bg-purple-950/30"
                />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </AdminPageShell>
  );
}
