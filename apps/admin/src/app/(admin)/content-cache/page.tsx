"use client";

import { useCallback, useState } from "react";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import { adminFetch, getToken } from "@/lib/api";
import { useRouter } from "next/navigation";

type CacheInspect = {
  cacheKey: string;
  state: string;
  ttlSeconds: number;
  tags: string[];
  record: {
    schemaVersion?: string;
    generatedAt?: string;
    freshUntil?: string;
    staleUntil?: string;
    payloadHash?: string;
    generation?: number;
  } | null;
};

type CacheConfig = {
  schemaVersion: string;
  tenant: string;
  enabled: boolean;
  ttlSeconds: number;
  staleSeconds: number;
  lockTtlMs: number;
  redisDb: number;
  redisReady: boolean;
  staleWhileRevalidate: boolean;
};

export default function ContentCacheInspectorPage() {
  const router = useRouter();
  const [appKey, setAppKey] = useState("main");
  const [pageKey, setPageKey] = useState("home");
  const [locale, setLocale] = useState("en");
  const [config, setConfig] = useState<CacheConfig | null>(null);
  const [inspect, setInspect] = useState<CacheInspect | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const ensureAuth = () => {
    if (!getToken()) {
      router.push("/");
      return false;
    }
    return true;
  };

  const loadConfig = useCallback(async () => {
    if (!ensureAuth()) return;
    const res = await adminFetch<CacheConfig>("/api/admin/content-cache/config");
    if (res.success && res.data) setConfig(res.data);
    else setMessage(res.error ?? "Failed to load cache config");
  }, [router]);

  const runInspect = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    setMessage("");
    const qs = new URLSearchParams({ appKey, pageKey, locale });
    const res = await adminFetch<CacheInspect>(`/api/admin/content-cache/inspect?${qs}`);
    setBusy(false);
    if (res.success && res.data) {
      setInspect(res.data);
      setMessage(`Inspected ${res.data.cacheKey} — ${res.data.state}`);
    } else {
      setMessage(res.error ?? "Inspect failed");
    }
  };

  const runInvalidate = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    setMessage("");
    const res = await adminFetch<{ keysInvalidated: number }>("/api/admin/content-cache/invalidate", {
      method: "POST",
      body: JSON.stringify({ appKey, pageKey, locale, kind: "page", reason: "admin-ui" }),
    });
    setBusy(false);
    setMessage(
      res.success
        ? `Invalidated ${res.data?.keysInvalidated ?? 0} key(s)`
        : res.error ?? "Invalidate failed"
    );
    await runInspect();
  };

  const runRebuild = async () => {
    if (!ensureAuth()) return;
    setBusy(true);
    setMessage("");
    const res = await adminFetch<{ cacheKey: string; payloadHash: string; statusAfter: string }>(
      "/api/admin/content-cache/rebuild",
      {
        method: "POST",
        body: JSON.stringify({ appKey, pageKey, locale }),
      }
    );
    setBusy(false);
    setMessage(
      res.success
        ? `Rebuilt ${res.data?.cacheKey} hash=${res.data?.payloadHash} (${res.data?.statusAfter})`
        : res.error ?? "Rebuild failed"
    );
    await runInspect();
  };

  return (
    <AdminPageShell
      cmsPageKey="content-cache"
      title="Content Cache"
      subtitle="Inspect, invalidate, and rebuild complete-page Redis cache entries. Never FLUSHALL/FLUSHDB."
      stats={
        config
          ? [
              { label: "Version", value: config.schemaVersion, icon: "v", glow: "purple" as const },
              { label: "Fresh TTL", value: `${config.ttlSeconds}s`, icon: "⏱", glow: "gold" as const },
              { label: "Stale", value: `${config.staleSeconds}s`, icon: "⌛", glow: "purple" as const },
              {
                label: "Redis",
                value: config.redisReady ? "up" : "down",
                icon: config.redisReady ? "🟢" : "🔴",
                glow: config.redisReady ? ("gold" as const) : ("purple" as const),
              },
            ]
          : undefined
      }
    >
      <div className="space-y-6 max-w-3xl">
        <GlassCard className="p-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <PortalButton type="button" onClick={() => void loadConfig()} disabled={busy}>
              Load config
            </PortalButton>
            <PortalButton type="button" onClick={() => void runInspect()} disabled={busy}>
              Inspect
            </PortalButton>
            <PortalButton type="button" onClick={() => void runInvalidate()} disabled={busy}>
              Invalidate page
            </PortalButton>
            <PortalButton type="button" onClick={() => void runRebuild()} disabled={busy}>
              Rebuild
            </PortalButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="appKey">App</Label>
              <Input id="appKey" value={appKey} onChange={(e) => setAppKey(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pageKey">Page</Label>
              <Input id="pageKey" value={pageKey} onChange={(e) => setPageKey(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="locale">Locale</Label>
              <Input id="locale" value={locale} onChange={(e) => setLocale(e.target.value)} />
            </div>
          </div>

          {message ? <p className="text-sm text-purple-200/80">{message}</p> : null}
        </GlassCard>

        {inspect ? (
          <GlassCard className="p-5 space-y-2 text-sm text-purple-100/90">
            <p>
              <span className="text-purple-400">Key:</span> {inspect.cacheKey}
            </p>
            <p>
              <span className="text-purple-400">State:</span> {inspect.state} · TTL {inspect.ttlSeconds}s
            </p>
            {inspect.record ? (
              <>
                <p>
                  <span className="text-purple-400">Hash:</span> {inspect.record.payloadHash}
                </p>
                <p>
                  <span className="text-purple-400">Generated:</span> {inspect.record.generatedAt}
                </p>
                <p>
                  <span className="text-purple-400">Fresh until:</span> {inspect.record.freshUntil}
                </p>
                <p>
                  <span className="text-purple-400">Stale until:</span> {inspect.record.staleUntil}
                </p>
              </>
            ) : (
              <p>No cache record (MISS).</p>
            )}
            <p>
              <span className="text-purple-400">Tags:</span> {(inspect.tags ?? []).join(", ") || "—"}
            </p>
          </GlassCard>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
