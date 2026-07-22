"use client";
import { useCallback, useEffect, useState } from "react";
import { AdminPageShell } from "@/components/AdminPageShell";
import { adminFetch } from "@/lib/api";
import { GlassCard, PortalButton } from "@tasks-cash/ui";

interface StatusData { enabled: boolean; maintenanceMode: boolean; submitEnabled: boolean; synchronizationEnabled: boolean; apiVersion: string; circuitBreaker: { state: string; failures: number }; counts: Record<string, number>; }
interface Execution { executionId: string; capability: string; localStatus: string; createdAt: string; updatedAt: string; errorCode?: string; }
interface Metrics { jobs: Array<{ jobName: string; status: string; count: number }>; dlq: number; webhooks: Array<{ status: string; count: number; last?: string }>; latencies: { averageSubmissionMs: number | null; averageExecutionMs: number | null }; }

export default function MiraajIntegrationPage() {
  const [tenantId, setTenantId] = useState("public"); const [status, setStatus] = useState<StatusData | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null); const [items, setItems] = useState<Execution[]>([]);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const headers = { "x-tenant-id": tenantId };
  const load = useCallback(async () => {
    setLoading(true); setError("");
    const [s, e, m] = await Promise.all([
      adminFetch<StatusData>("/api/admin/miraaj/status", { headers }),
      adminFetch<{ items: Execution[] }>("/api/admin/miraaj/executions?limit=25", { headers }),
      adminFetch<Metrics>("/api/admin/miraaj/metrics", { headers }),
    ]);
    if (s.success && s.data) setStatus(s.data); else setError(s.error ?? "Failed to load Miraaj status");
    if (e.success && e.data) setItems(e.data.items); if (m.success && m.data) setMetrics(m.data); setLoading(false);
  }, [tenantId]);
  useEffect(() => { void load(); }, [load]);
  async function test() { if (!window.confirm("Run a live connection test against Miraaj AI?")) return; const result = await adminFetch("/api/admin/miraaj/test-connection", { method: "POST", headers, body: "{}" }); setError(result.success ? "Connection test succeeded" : result.error ?? "Connection failed"); await load(); }
  async function refreshCapabilities() { const result = await adminFetch("/api/admin/miraaj/capabilities/refresh", { method: "POST", headers, body: "{}" }); setError(result.success ? "Capabilities refreshed" : result.error ?? "Capability refresh failed"); }
  const webhookCount = (state: string) => metrics?.webhooks.find((item) => item.status === state)?.count ?? 0;
  const duration = (value: number | null | undefined) => value == null ? "—" : `${Math.round(value)} ms`;
  return <AdminPageShell title="Miraaj AI Integration" subtitle="Tasks.cash external AI execution boundary" action={<div className="flex gap-2"><input aria-label="Tenant ID" className="auth-input w-40" value={tenantId} onChange={(event) => setTenantId(event.target.value)} /><PortalButton size="sm" onClick={() => void load()}>Refresh</PortalButton><PortalButton size="sm" onClick={() => void refreshCapabilities()}>Refresh capabilities</PortalButton><PortalButton size="sm" variant="gold" onClick={() => void test()}>Test connection</PortalButton></div>} stats={status ? [{ label: "Enabled", value: status.enabled ? "Yes" : "No", icon: "🔌" }, { label: "Circuit", value: status.circuitBreaker.state, icon: "⚡" }, { label: "Running", value: status.counts.running ?? 0, icon: "▶" }, { label: "DLQ", value: metrics?.dlq ?? 0, icon: "⚠" }] : undefined}>
    {loading && <p className="mb-4 text-purple-200">Loading diagnostics…</p>}{error && <p className="mb-4 text-amber-300">{error}</p>}
    <GlassCard className="mb-4 p-5"><div className="grid gap-2 text-sm md:grid-cols-4"><p>API version: {status?.apiVersion ?? "—"}</p><p>Maintenance: {status?.maintenanceMode ? "On" : "Off"}</p><p>Submission: {status?.submitEnabled ? "Enabled" : "Disabled"}</p><p>Synchronization: {status?.synchronizationEnabled ? "Enabled" : "Disabled"}</p><p>Circuit failures: {status?.circuitBreaker.failures ?? 0}</p><p>Webhook accepted: {webhookCount("processed")}</p><p>Webhook rejected: {webhookCount("rejected")}</p><p>Average submission: {duration(metrics?.latencies.averageSubmissionMs)}</p><p>Average execution: {duration(metrics?.latencies.averageExecutionMs)}</p></div></GlassCard>
    <GlassCard className="p-5"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-purple-300"><th className="p-2">Execution</th><th>Capability</th><th>Status</th><th>Updated</th><th>Error</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.executionId} className="border-t border-purple-500/20"><td className="p-2 font-mono text-xs">{item.executionId}</td><td>{item.capability}</td><td>{item.localStatus}</td><td>{new Date(item.updatedAt).toLocaleString()}</td><td>{item.errorCode ?? "—"}</td><td><a className="text-purple-300 underline" href={`/api/admin/miraaj/executions/${item.executionId}/timeline`}>Timeline</a></td></tr>)}</tbody></table>{!loading && items.length === 0 && <p className="p-4 text-center text-purple-200">No executions for this tenant.</p>}</div></GlassCard>
  </AdminPageShell>;
}
