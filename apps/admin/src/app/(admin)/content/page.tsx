"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContentAppKey, ContentAuditReport, ContentBlockType, ContentLocale, IContentBlock } from "@tasks-cash/types";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";
import {
  CMS_APPS,
  CMS_CONTENT_TYPES,
  CMS_PAGES,
  CMS_SECTION_LABELS,
  CMS_SECTION_ORDER,
} from "@/config/contentPages";
import { cn } from "@/lib/utils";

const LOCALES: ContentLocale[] = ["en", "ar", "fr"];

type ContentListResponse = { blocks: IContentBlock[]; pages: string[] };

type DraftMap = Record<string, string>;

function blockCompositeKey(block: Pick<IContentBlock, "sectionKey" | "contentKey">) {
  return `${block.sectionKey}::${block.contentKey}`;
}

function groupBlocksBySection(blocks: IContentBlock[]) {
  const groups = new Map<string, IContentBlock[]>();
  for (const block of blocks) {
    const list = groups.get(block.sectionKey) ?? [];
    list.push(block);
    groups.set(block.sectionKey, list);
  }
  return groups;
}

export default function AdminContentPage() {
  const [appKey, setAppKey] = useState<ContentAppKey>("main");
  const [pageKey, setPageKey] = useState("home");
  const [localeTab, setLocaleTab] = useState<ContentLocale>("en");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [blocks, setBlocks] = useState<IContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<ContentAuditReport | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [auditOpen, setAuditOpen] = useState(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = Object.keys(drafts).length > 0;

  const pages = CMS_PAGES[appKey];

  useEffect(() => {
    const first = CMS_PAGES[appKey][0]?.key;
    if (first && !CMS_PAGES[appKey].some((p) => p.key === pageKey)) {
      setPageKey(first);
    }
  }, [appKey, pageKey]);

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ appKey, pageKey });
    if (search.trim()) params.set("search", search.trim());
    if (typeFilter !== "all") params.set("type", typeFilter);

    const res = await adminFetch<ContentListResponse>(`/api/admin/content?${params}`);
    if (res.success && res.data) {
      setBlocks(res.data.blocks);
      setDrafts({});
    } else {
      setError(res.error ?? "Failed to load content");
    }
    setLoading(false);
  }, [appKey, pageKey, search, typeFilter]);

  useEffect(() => {
    void loadBlocks();
  }, [loadBlocks]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    const res = await adminFetch<ContentAuditReport>("/api/admin/content/audit");
    if (res.success && res.data) setAudit(res.data);
    setAuditLoading(false);
  }, []);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  async function handleImportMissing() {
    setImporting(true);
    setError("");
    const res = await adminFetch<{ created: number; skipped: number; failed: number; audit: ContentAuditReport }>(
      "/api/admin/content/import-missing",
      { method: "POST", body: JSON.stringify({}) }
    );
    setImporting(false);
    if (res.success && res.data) {
      setAudit(res.data.audit);
      void loadBlocks();
    } else {
      setError(res.error ?? "Import failed");
    }
  }

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const localeBlocks = useMemo(
    () => blocks.filter((b) => b.locale === localeTab),
    [blocks, localeTab]
  );

  const sectionGroups = useMemo(() => groupBlocksBySection(localeBlocks), [localeBlocks]);

  const orderedSections = useMemo(() => {
    const keys = [...sectionGroups.keys()];
    return keys.sort((a, b) => {
      const ai = CMS_SECTION_ORDER.indexOf(a as (typeof CMS_SECTION_ORDER)[number]);
      const bi = CMS_SECTION_ORDER.indexOf(b as (typeof CMS_SECTION_ORDER)[number]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [sectionGroups]);

  function getDraftValue(block: IContentBlock) {
    const key = `${block.id}`;
    return drafts[key] ?? block.value;
  }

  function setDraft(block: IContentBlock, value: string) {
    setDrafts((prev) => {
      if (value === block.value) {
        const next = { ...prev };
        delete next[block.id];
        return next;
      }
      return { ...prev, [block.id]: value };
    });
  }

  const saveAll = useCallback(async () => {
    const changed = blocks.filter((b) => drafts[b.id] !== undefined && drafts[b.id] !== b.value);
    if (changed.length === 0) return;

    setSaveState("saving");
    setError("");

    const payload = changed.map((b) => ({
      appKey: b.appKey,
      pageKey: b.pageKey,
      sectionKey: b.sectionKey,
      contentKey: b.contentKey,
      type: b.type,
      locale: b.locale,
      value: drafts[b.id] ?? b.value,
      defaultValue: b.defaultValue,
      isActive: b.isActive,
    }));

    const res = await adminFetch<{ blocks: IContentBlock[] }>("/api/admin/content/bulk-upsert", {
      method: "POST",
      body: JSON.stringify({ blocks: payload }),
    });

    if (!res.success) {
      setSaveState("error");
      setError(res.error ?? "Save failed");
      return;
    }

    setBlocks((prev) =>
      prev.map((b) => {
        const updated = res.data?.blocks.find(
          (u) =>
            u.appKey === b.appKey &&
            u.pageKey === b.pageKey &&
            u.sectionKey === b.sectionKey &&
            u.contentKey === b.contentKey &&
            u.locale === b.locale
        );
        return updated ?? b;
      })
    );
    setDrafts({});
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [blocks, drafts]);

  useEffect(() => {
    if (!dirty) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void saveAll();
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [dirty, drafts, saveAll]);

  async function resetBlock(block: IContentBlock) {
    setSaveState("saving");
    const res = await adminFetch<IContentBlock>(`/api/admin/content/${block.id}`, {
      method: "PATCH",
      body: JSON.stringify({ resetToDefault: true }),
    });
    setSaveState("idle");
    if (res.success && res.data) {
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? res.data! : b)));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[block.id];
        return next;
      });
    }
  }

  async function toggleActive(block: IContentBlock) {
    const res = await adminFetch<IContentBlock>(`/api/admin/content/${block.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !block.isActive }),
    });
    if (res.success && res.data) {
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? res.data! : b)));
    }
  }

  async function createBlock(sectionKey: string) {
    const contentKey = window.prompt("Content key (e.g. title, submitButton):");
    if (!contentKey?.trim()) return;
    const value = window.prompt("Default value (EN):") ?? "";
    if (!value.trim()) return;

    const rows = LOCALES.map((locale) => ({
      appKey,
      pageKey,
      sectionKey,
      contentKey: contentKey.trim(),
      type: "label" as ContentBlockType,
      locale,
      value: locale === "en" ? value.trim() : value.trim(),
      defaultValue: value.trim(),
      isActive: true,
    }));

    const res = await adminFetch<{ blocks: IContentBlock[] }>("/api/admin/content/bulk-upsert", {
      method: "POST",
      body: JSON.stringify({ blocks: rows }),
    });

    if (res.success) void loadBlocks();
  }

  const stats = [
    { label: "Blocks", value: blocks.length },
    { label: "This locale", value: localeBlocks.length },
    { label: "Sections", value: sectionGroups.size },
    { label: "Unsaved", value: Object.keys(drafts).length },
  ];

  return (
    <div className="min-h-screen bg-black text-white -m-6">
      <div className="border-b border-purple-500/20 bg-black/80 backdrop-blur-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-[family-name:var(--font-cinzel)] text-white">Content Management</h1>
          <p className="text-sm text-purple-400/60 mt-1">Edit live copy for Main (3000) and Challenge (3001) apps</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border",
              saveState === "saving" && "border-amber-400/40 text-amber-300 bg-amber-950/30",
              saveState === "saved" && "border-emerald-400/40 text-emerald-300 bg-emerald-950/30",
              saveState === "error" && "border-red-400/40 text-red-300 bg-red-950/30",
              saveState === "idle" && !dirty && "border-purple-500/20 text-purple-400/50",
              saveState === "idle" && dirty && "border-amber-400/40 text-amber-300"
            )}
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : dirty ? "Unsaved changes" : "Up to date"}
          </span>
          <PortalButton variant="gold" size="sm" disabled={!dirty || saveState === "saving"} onClick={() => void saveAll()}>
            Save All
          </PortalButton>
        </div>
      </div>

      {/* CMS Audit Report */}
      <div className="border-b border-purple-500/15 bg-purple-950/20 px-6 py-4">
        <button
          type="button"
          onClick={() => setAuditOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-amber-200">CMS Audit Report</h2>
            <p className="text-xs text-purple-400/50 mt-1">
              Coverage gaps, missing translations, and unwired pages
            </p>
          </div>
          <span className="text-purple-400/60 text-xs">{auditOpen ? "▲" : "▼"}</span>
        </button>

        {auditOpen && (
          <div className="mt-4 space-y-4">
            {auditLoading && !audit ? (
              <p className="text-sm text-purple-400/60">Running audit…</p>
            ) : audit ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <AuditStat label="Seed keys" value={audit.seedKeyCount} />
                  <AuditStat label="In database" value={audit.dbKeyCount} />
                  <AuditStat label="Missing keys" value={audit.missingKeys.length} warn={audit.missingKeys.length > 0} />
                  <AuditStat label="Unwired pages" value={audit.unwiredPages.length} warn={audit.unwiredPages.length > 0} />
                  <AuditStat label="Translation gaps" value={audit.translationGaps.length} warn={audit.translationGaps.length > 0} />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <PortalButton
                    variant="gold"
                    size="sm"
                    disabled={importing || audit.missingKeys.length === 0}
                    onClick={() => void handleImportMissing()}
                  >
                    {importing ? "Importing…" : "Import Missing Content"}
                  </PortalButton>
                  <PortalButton variant="ghost" size="sm" onClick={() => void loadAudit()}>
                    Refresh Audit
                  </PortalButton>
                  {audit.lastUpdated && (
                    <span className="text-[10px] text-purple-400/50 uppercase tracking-wider">
                      Last updated: {new Date(audit.lastUpdated).toLocaleString()}
                    </span>
                  )}
                </div>

                {audit.missingKeys.length > 0 && (
                  <AuditList
                    title="Missing content keys (in seed, not in database)"
                    items={audit.missingKeys.slice(0, 20).map(
                      (k) => `${k.appKey}/${k.pageKey} · ${k.sectionKey}.${k.contentKey} [${k.locale}]`
                    )}
                    more={audit.missingKeys.length > 20 ? audit.missingKeys.length - 20 : 0}
                  />
                )}

                {audit.unwiredPages.length > 0 && (
                  <AuditList
                    title="Pages not connected to CMS (no useContent wired)"
                    items={audit.unwiredPages.map((p) => `${p.appKey}/${p.pageKey} — ${p.label}`)}
                  />
                )}

                {audit.translationGaps.length > 0 && (
                  <AuditList
                    title="Translation gaps (missing AR/FR in seed definitions)"
                    items={audit.translationGaps.slice(0, 15).map(
                      (g) => `${g.appKey}/${g.pageKey} · ${g.sectionKey}.${g.contentKey} → ${g.missingLocales.join(", ")}`
                    )}
                    more={audit.translationGaps.length > 15 ? audit.translationGaps.length - 15 : 0}
                  />
                )}

                {audit.missingKeys.length === 0 && audit.unwiredPages.length === 0 && audit.translationGaps.length === 0 && (
                  <p className="text-sm text-emerald-300/80">All seed content is in the database and pages are wired.</p>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex min-h-[calc(100vh-5rem)]">
        {/* Apps sidebar */}
        <aside className="w-52 shrink-0 border-r border-purple-500/15 bg-purple-950/10 p-4">
          <p className="text-[10px] uppercase tracking-widest text-purple-400/40 mb-3 font-bold">Applications</p>
          <nav className="space-y-1">
            {CMS_APPS.map((app) => (
              <button
                key={app.key}
                type="button"
                onClick={() => setAppKey(app.key)}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                  appKey === app.key
                    ? "bg-purple-900/50 text-amber-200 border border-amber-400/30"
                    : "text-purple-300/70 hover:bg-purple-900/30 hover:text-purple-100"
                )}
              >
                <span>{app.icon}</span>
                <span className="font-semibold">{app.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Pages list */}
        <aside className="w-56 shrink-0 border-r border-purple-500/15 p-4 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-purple-400/40 mb-3 font-bold">Pages</p>
          <nav className="space-y-0.5">
            {pages.map((page) => (
              <button
                key={page.key}
                type="button"
                onClick={() => setPageKey(page.key)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors",
                  pageKey === page.key
                    ? "bg-violet-900/40 text-violet-100"
                    : "text-purple-400/60 hover:text-purple-200 hover:bg-purple-950/40"
                )}
              >
                {page.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Editor */}
        <main className="flex-1 min-w-0 p-6 overflow-y-auto">
          <GlassCard className="p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="cms-search">Search</Label>
                <Input
                  id="cms-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search keys or values…"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type-filter">Type</Label>
                <select
                  id="type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="mt-1 block rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white"
                >
                  <option value="all">All types</option>
                  {CMS_CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <PortalButton variant="ghost" size="sm" onClick={() => void loadBlocks()}>
                Refresh
              </PortalButton>
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-purple-500/10">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-lg font-black text-amber-300">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-purple-400/50">{s.label}</p>
                </div>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          </GlassCard>

          {/* Locale tabs */}
          <div className="flex gap-2 mb-6">
            {LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocaleTab(loc)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider border transition-colors",
                  localeTab === loc
                    ? "border-amber-400/50 bg-amber-950/40 text-amber-200"
                    : "border-purple-500/20 text-purple-400/60 hover:text-purple-200"
                )}
              >
                {loc === "en" ? "English" : loc === "ar" ? "العربية" : "Français"}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-purple-400/60 text-sm">Loading content blocks…</p>
          ) : localeBlocks.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-purple-300/60 mb-4">No content blocks for this page yet.</p>
              <PortalButton variant="gold" size="sm" onClick={() => void createBlock("hero")}>
                Add hero block
              </PortalButton>
              <p className="text-xs text-purple-400/40 mt-4">Run <code className="text-amber-300">pnpm seed:content</code> in services/api to seed defaults.</p>
            </GlassCard>
          ) : (
            <div className="space-y-8">
              {orderedSections.map((sectionKey) => {
                const sectionBlocks = (sectionGroups.get(sectionKey) ?? []).filter(
                  (b) => typeFilter === "all" || b.type === typeFilter
                );
                if (sectionBlocks.length === 0) return null;

                return (
                  <section key={sectionKey}>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-purple-200">
                        {CMS_SECTION_LABELS[sectionKey] ?? sectionKey}
                      </h2>
                      <PortalButton variant="ghost" size="sm" onClick={() => void createBlock(sectionKey)}>
                        + Add field
                      </PortalButton>
                    </div>
                    <div className="grid gap-4">
                      {sectionBlocks.map((block) => {
                        const draft = getDraftValue(block);
                        const isDirty = drafts[block.id] !== undefined;
                        return (
                          <GlassCard
                            key={block.id}
                            className={cn("p-4", !block.isActive && "opacity-50", isDirty && "ring-1 ring-amber-400/30")}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider text-purple-400/50 font-mono">
                                  {blockCompositeKey(block)}
                                </span>
                                <span className="ml-2 text-[10px] rounded px-1.5 py-0.5 bg-purple-950/50 text-purple-300/70 border border-purple-500/20">
                                  {block.type}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => void toggleActive(block)}
                                  className={cn(
                                    "text-[10px] font-bold uppercase",
                                    block.isActive ? "text-emerald-400" : "text-amber-400"
                                  )}
                                >
                                  {block.isActive ? "Active" : "Inactive"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void resetBlock(block)}
                                  className="text-[10px] font-bold uppercase text-purple-400/60 hover:text-purple-200"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={draft}
                              onChange={(e) => setDraft(block, e.target.value)}
                              rows={block.type === "description" ? 4 : 2}
                              dir={block.locale === "ar" ? "rtl" : "ltr"}
                              className={cn(
                                "w-full rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white",
                                block.locale === "ar" && "text-right"
                              )}
                            />
                            {block.defaultValue && block.defaultValue !== draft && (
                              <p className="text-[10px] text-purple-400/40 mt-2 truncate">Default: {block.defaultValue}</p>
                            )}
                          </GlassCard>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function AuditStat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-center", warn ? "border-amber-400/30 bg-amber-950/20" : "border-purple-500/20 bg-black/30")}>
      <p className={cn("text-lg font-black", warn ? "text-amber-300" : "text-white")}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-purple-400/50">{label}</p>
    </div>
  );
}

function AuditList({ title, items, more }: { title: string; items: string[]; more?: number }) {
  return (
    <div className="rounded-lg border border-purple-500/15 bg-black/30 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300/70 mb-2">{title}</p>
      <ul className="text-xs text-purple-400/60 space-y-1 font-mono max-h-32 overflow-y-auto">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {more && more > 0 ? <p className="text-[10px] text-purple-400/40 mt-2">+{more} more…</p> : null}
    </div>
  );
}
