"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";
import type { ContentBlockType, ContentLocale, IContentBlock } from "@tasks-cash/types";
import { cn } from "@/lib/utils";

const LOCALES: ContentLocale[] = ["en", "ar", "fr"];
const TYPES: ContentBlockType[] = ["title", "subtitle", "description", "button", "label", "notice"];

type ContentListResponse = {
  blocks: IContentBlock[];
  pages: string[];
};

function emptyForm(): Omit<IContentBlock, "id" | "updatedAt"> {
  return {
    pageKey: "dashboard",
    sectionKey: "hero",
    contentKey: "title",
    type: "title",
    value: "",
    locale: "en",
    isActive: true,
  };
}

export default function AdminContentPage() {
  const [blocks, setBlocks] = useState<IContentBlock[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [pageKey, setPageKey] = useState<string>("all");
  const [locale, setLocale] = useState<ContentLocale | "all">("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm());

  const loadBlocks = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (pageKey !== "all") params.set("pageKey", pageKey);
    if (locale !== "all") params.set("locale", locale);
    const qs = params.toString();
    const res = await adminFetch<ContentListResponse>(`/api/admin/content${qs ? `?${qs}` : ""}`);
    if (res.success && res.data) {
      setBlocks(res.data.blocks);
      setPages(res.data.pages);
      setEditing({});
    } else {
      setError(res.error ?? "Failed to load content blocks");
    }
    setLoading(false);
  }, [pageKey, locale]);

  useEffect(() => {
    void loadBlocks();
  }, [loadBlocks]);

  const stats = useMemo(
    () => [
      { label: "Pages", value: pages.length, icon: "📄", glow: "gold" as const },
      { label: "Blocks", value: blocks.length, icon: "📝" },
      { label: "Locales", value: LOCALES.length, icon: "🌐" },
      { label: "Active", value: blocks.filter((b) => b.isActive).length, icon: "✅" },
    ],
    [blocks, pages.length]
  );

  function startEdit(block: IContentBlock) {
    setEditing((prev) => ({ ...prev, [block.id]: block.value }));
  }

  function updateEdit(id: string, value: string) {
    setEditing((prev) => ({ ...prev, [id]: value }));
  }

  async function saveBlock(block: IContentBlock) {
    const value = editing[block.id];
    if (value === undefined || value === block.value) return;

    setSavingId(block.id);
    setError("");
    setSuccess("");
    const res = await adminFetch<IContentBlock>(`/api/admin/content/${block.id}`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
    });
    setSavingId(null);

    if (!res.success || !res.data) {
      setError(res.error ?? "Failed to save content block");
      return;
    }

    setBlocks((prev) => prev.map((b) => (b.id === block.id ? res.data! : b)));
    setEditing((prev) => {
      const next = { ...prev };
      delete next[block.id];
      return next;
    });
    setSuccess(`Saved ${block.pageKey} · ${block.contentKey} (${block.locale})`);
  }

  async function toggleActive(block: IContentBlock) {
    setSavingId(block.id);
    const res = await adminFetch<IContentBlock>(`/api/admin/content/${block.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !block.isActive }),
    });
    setSavingId(null);
    if (res.success && res.data) {
      setBlocks((prev) => prev.map((b) => (b.id === block.id ? res.data! : b)));
    }
  }

  async function createBlock(e: React.FormEvent) {
    e.preventDefault();
    setSavingId("create");
    setError("");
    const res = await adminFetch<IContentBlock>("/api/admin/content", {
      method: "POST",
      body: JSON.stringify(createForm),
    });
    setSavingId(null);

    if (!res.success || !res.data) {
      setError(res.error ?? "Failed to create content block");
      return;
    }

    setBlocks((prev) => [...prev, res.data!]);
    if (!pages.includes(res.data!.pageKey)) {
      setPages((prev) => [...prev, res.data!.pageKey].sort());
    }
    setShowCreate(false);
    setCreateForm(emptyForm());
    setSuccess(`Created ${res.data.pageKey} · ${res.data.contentKey}`);
  }

  return (
    <AdminPageShell
      title="Content Management"
      subtitle="Edit page titles, subtitles, buttons, labels, and descriptions per locale"
      action={
        <PortalButton variant="gold" size="sm" onClick={() => setShowCreate(true)}>
          + New Block
        </PortalButton>
      }
      stats={stats}
    >
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label htmlFor="pageFilter">Page</Label>
            <select
              id="pageFilter"
              value={pageKey}
              onChange={(e) => setPageKey(e.target.value)}
              className="mt-1 block rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="all">All pages</option>
              {pages.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="localeFilter">Locale</Label>
            <select
              id="localeFilter"
              value={locale}
              onChange={(e) => setLocale(e.target.value as ContentLocale | "all")}
              className="mt-1 block rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="all">All locales</option>
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <PortalButton variant="ghost" size="sm" onClick={() => void loadBlocks()}>
            Refresh
          </PortalButton>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        {success && <p className="text-emerald-400 text-sm mt-3">{success}</p>}
      </GlassCard>

      {showCreate && (
        <GlassCard glow="gold" className="p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">New Content Block</h3>
          <form onSubmit={createBlock} className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Page Key</Label>
              <Input
                value={createForm.pageKey}
                onChange={(e) => setCreateForm((f) => ({ ...f, pageKey: e.target.value }))}
                required
                className="mt-1"
                placeholder="dashboard"
              />
            </div>
            <div>
              <Label>Section Key</Label>
              <Input
                value={createForm.sectionKey}
                onChange={(e) => setCreateForm((f) => ({ ...f, sectionKey: e.target.value }))}
                required
                className="mt-1"
                placeholder="hero"
              />
            </div>
            <div>
              <Label>Content Key</Label>
              <Input
                value={createForm.contentKey}
                onChange={(e) => setCreateForm((f) => ({ ...f, contentKey: e.target.value }))}
                required
                className="mt-1"
                placeholder="title"
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as ContentBlockType }))}
                className="mt-1 w-full rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Locale</Label>
              <select
                value={createForm.locale}
                onChange={(e) => setCreateForm((f) => ({ ...f, locale: e.target.value as ContentLocale }))}
                className="mt-1 w-full rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white"
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Value</Label>
              <textarea
                value={createForm.value}
                onChange={(e) => setCreateForm((f) => ({ ...f, value: e.target.value }))}
                required
                rows={3}
                className="mt-1 w-full rounded-lg border border-purple-500/20 bg-black/40 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <PortalButton variant="gold" size="sm" disabled={savingId === "create"}>
                Create
              </PortalButton>
              <PortalButton variant="ghost" size="sm" type="button" onClick={() => setShowCreate(false)}>
                Cancel
              </PortalButton>
            </div>
          </form>
        </GlassCard>
      )}

      {loading ? (
        <p className="text-purple-400/60 text-sm">Loading content blocks...</p>
      ) : (
        <AdminTable
          headers={["Page", "Section", "Key", "Type", "Locale", "Value", "Status", "Actions"]}
          rows={blocks.map((block) => {
            const isEditing = editing[block.id] !== undefined;
            const draft = isEditing ? editing[block.id] : block.value;
            const dirty = isEditing && draft !== block.value;

            return [
              block.pageKey,
              block.sectionKey,
              block.contentKey,
              block.type,
              block.locale,
              <div key={`val-${block.id}`} className="min-w-[200px] max-w-md">
                {isEditing ? (
                  <textarea
                    value={draft}
                    onChange={(e) => updateEdit(block.id, e.target.value)}
                    rows={2}
                    className="w-full rounded border border-purple-500/20 bg-black/40 px-2 py-1 text-xs text-white"
                  />
                ) : (
                  <span className="text-xs text-purple-200/80 line-clamp-2">{block.value}</span>
                )}
              </div>,
              <button
                key={`status-${block.id}`}
                type="button"
                onClick={() => void toggleActive(block)}
                className={cn(
                  "text-xs font-bold uppercase",
                  block.isActive ? "text-green-400" : "text-amber-400"
                )}
              >
                {block.isActive ? "active" : "inactive"}
              </button>,
              <div key={`actions-${block.id}`} className="flex gap-2 flex-wrap">
                {!isEditing ? (
                  <PortalButton variant="ghost" size="sm" onClick={() => startEdit(block)}>
                    Edit
                  </PortalButton>
                ) : (
                  <>
                    <PortalButton
                      variant="gold"
                      size="sm"
                      disabled={!dirty || savingId === block.id}
                      onClick={() => void saveBlock(block)}
                    >
                      Save
                    </PortalButton>
                    <PortalButton
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditing((prev) => {
                          const next = { ...prev };
                          delete next[block.id];
                          return next;
                        })
                      }
                    >
                      Cancel
                    </PortalButton>
                  </>
                )}
              </div>,
            ];
          })}
        />
      )}
    </AdminPageShell>
  );
}
