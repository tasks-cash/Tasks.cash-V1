"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import type { DNAQuestionType } from "@tasks-cash/types";
import { adminFetch } from "@/lib/api";
import { DNA_CATEGORY_LABELS, DNA_DIFFICULTY_LABELS, DNA_QUESTION_TYPE_LABELS } from "@/data/explorer-dna-data";

type Tab = "modules" | "questions" | "import";

type DNADifficulty = keyof typeof DNA_DIFFICULTY_LABELS;

interface AdminDNAModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  color: string;
  requiredLevel: number;
  isActive: boolean;
  xpReward: number;
  bronzeReward: number;
  silverReward: number;
  goldReward: number;
  diamondReward: number;
}

interface AdminDNAQuestion {
  id: string;
  moduleId: string;
  title: string;
  prompt?: string;
  questionType: DNAQuestionType;
  answerType?: DNAQuestionType;
  choices?: string[];
  options?: string[];
  required: boolean;
  difficulty: DNADifficulty;
  requiredLevel: number;
  intelligenceReward: number;
  displayOrder: number;
  isActive: boolean;
  enabled?: boolean;
  xpReward: number;
  bronzeReward: number;
  silverReward: number;
  goldReward: number;
  diamondReward: number;
}

const QUESTION_TYPES: DNAQuestionType[] = [
  "text", "textarea", "single_choice", "multiple_choice", "checkbox", "dropdown",
  "slider", "rating", "date", "time", "country", "number", "file_upload", "image_upload",
];

export default function AdminExplorerDnaPage() {
  const [tab, setTab] = useState<Tab>("questions");
  const [modules, setModules] = useState<AdminDNAModule[]>([]);
  const [questions, setQuestions] = useState<AdminDNAQuestion[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [editingQ, setEditingQ] = useState<AdminDNAQuestion | null>(null);
  const [editingM, setEditingM] = useState<AdminDNAModule | null>(null);
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    setError("");
    const [modRes, qRes] = await Promise.all([
      adminFetch<AdminDNAModule[]>("/api/admin/explorer-dna/modules"),
      adminFetch<AdminDNAQuestion[]>("/api/admin/explorer-dna/questions"),
    ]);
    if (modRes.success && modRes.data) setModules(modRes.data);
    if (qRes.success && qRes.data) setQuestions(qRes.data);
    if (!modRes.success && !qRes.success) setError(modRes.error ?? qRes.error ?? "Failed to load DNA data");
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const title = q.title || q.prompt || "Untitled question";
      const moduleId = "";
      const difficulty = "";
  
      if (moduleFilter && moduleId !== moduleFilter) return false;
      if (!search.trim()) return true;
  
      const s = search.toLowerCase();
  
      return (
        title.toLowerCase().includes(s) ||
        moduleId.toLowerCase().includes(s) ||
        difficulty.toLowerCase().includes(s)
      );
    });
  }, [questions, search, moduleFilter]);

  async function saveQuestion() {
    if (!editingQ?.title?.trim() && !editingQ?.prompt?.trim()) return;
    const payload = { ...editingQ, title: editingQ.title ?? editingQ.prompt };
    const exists = questions.some((q) => q.id === editingQ.id);
    const res = exists
      ? await adminFetch<AdminDNAQuestion>(`/api/admin/explorer-dna/questions/${editingQ.id}`, { method: "PUT", body: JSON.stringify(payload) })
      : await adminFetch<AdminDNAQuestion>("/api/admin/explorer-dna/questions", { method: "POST", body: JSON.stringify(payload) });
    if (res.success && res.data) {
      setMessage("Question saved");
      setEditingQ(null);
      loadAll();
    } else setError(res.error ?? "Save failed");
  }

  async function saveModule() {
    if (!editingM?.title?.trim()) return;
    const exists = modules.some((m) => m.id === editingM.id);
    const res = exists
      ? await adminFetch<AdminDNAModule>(`/api/admin/explorer-dna/modules/${editingM.id}`, { method: "PUT", body: JSON.stringify(editingM) })
      : await adminFetch<AdminDNAModule>("/api/admin/explorer-dna/modules", { method: "POST", body: JSON.stringify(editingM) });
    if (res.success && res.data) {
      setMessage("Module saved");
      setEditingM(null);
      loadAll();
    } else setError(res.error ?? "Save failed");
  }

  async function runImport() {
    try {
      const rows = JSON.parse(importText);
      const res = await adminFetch<AdminDNAQuestion[]>("/api/admin/explorer-dna/questions/import", {
        method: "POST",
        body: JSON.stringify({ rows, format: "json" }),
      });
      if (res.success) {
        setMessage(`Imported ${(res as { count?: number }).count ?? rows.length} questions`);
        setImportText("");
        loadAll();
      } else setError(res.error ?? "Import failed");
    } catch {
      setError("Invalid JSON format");
    }
  }

  async function exportJson() {
    const res = await adminFetch<AdminDNAQuestion[]>("/api/admin/explorer-dna/questions/export?format=json");
    if (res.success && res.data) {
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "explorer-dna-questions.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <AdminPageShell
      title="Explorer DNA"
      subtitle="Manage modules, unlimited questions, rewards, import/export — database-ready intelligence engine"
      stats={[
        { label: "Modules", value: modules.length, icon: "🧬" },
        { label: "Questions", value: questions.length, icon: "❓" },
        { label: "Active Q", value: questions.filter((q) => q.enabled).length, icon: "✅" },
        { label: "Categories", value: new Set(questions.map((q) => q.moduleId)).size, icon: "📂" },
      ]}
    >
      {loading && <p className="text-purple-400/60 mb-4">Loading Explorer DNA admin…</p>}
      {message && <p className="text-emerald-400 text-sm mb-4">{message}</p>}
      {error && <p className="text-amber-300 text-sm mb-4">{error}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        {(["modules", "questions", "import"] as Tab[]).map((t) => (
          <PortalButton key={t} size="sm" variant={tab === t ? "gold" : "secondary"} onClick={() => setTab(t)}>
            {t === "modules" ? "Modules" : t === "questions" ? "Questions" : "Import / Export"}
          </PortalButton>
        ))}
      </div>

      {tab === "questions" && (
        <div className="grid xl:grid-cols-[1fr_420px] gap-6">
          <GlassCard className="p-6">
            <div className="flex flex-wrap gap-3 mb-4">
              <Input placeholder="Search title, module, difficulty…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px]" />
              <select className="auth-input" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
                <option value="">All modules</option>
                {modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <PortalButton variant="gold" size="sm" onClick={() => setEditingQ({ id: `q_${Date.now()}`, moduleId: "future", title: "", questionType: "text", required: true, difficulty: "simple", requiredLevel: 1, intelligenceReward: 3, displayOrder: questions.length + 1, isActive: true, xpReward: 5, bronzeReward: 2, silverReward: 0, goldReward: 0, diamondReward: 0 })}>
                + Create Question
              </PortalButton>
            </div>
            <div className="space-y-3 max-h-[640px] overflow-y-auto">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="rounded-xl border border-purple-500/15 bg-black/30 p-4">
                  <p className="font-semibold text-white">{q.title ?? q.prompt}</p>
                  <p className="text-[10px] text-purple-400/50 mt-1">
                    {DNA_CATEGORY_LABELS[q.moduleId] ?? q.moduleId} · {DNA_QUESTION_TYPE_LABELS[q.questionType ?? q.answerType ?? "text"]} · {DNA_DIFFICULTY_LABELS[q.difficulty]} · +{q.xpReward} XP
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <PortalButton size="sm" variant="secondary" onClick={() => setEditingQ({ ...q })}>Edit</PortalButton>
                    <PortalButton size="sm" variant="secondary" onClick={async () => {
                      await adminFetch(`/api/admin/explorer-dna/questions/${q.id}`, { method: "PUT", body: JSON.stringify({ isActive: !(q.isActive ?? q.enabled) }) });
                      loadAll();
                    }}>{q.isActive ?? q.enabled ? "Disable" : "Enable"}</PortalButton>
                    <PortalButton size="sm" variant="secondary" onClick={async () => {
                      await adminFetch(`/api/admin/explorer-dna/questions/${q.id}`, { method: "DELETE" });
                      loadAll();
                    }}>Delete</PortalButton>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {editingQ && (
            <GlassCard glow="gold" className="p-6 h-fit sticky top-6">
              <h2 className="font-bold text-white mb-4">Edit DNA Question</h2>
              <div className="space-y-3">
                <div><Label>Title</Label><Input className="mt-1" value={editingQ.title ?? editingQ.prompt ?? ""} onChange={(e) => setEditingQ({ ...editingQ, title: e.target.value })} /></div>
                <div><Label>Module</Label><select className="auth-input mt-1 w-full" value={editingQ.moduleId} onChange={(e) => setEditingQ({ ...editingQ, moduleId: e.target.value })}>{modules.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</select></div>
                <div><Label>Type</Label><select className="auth-input mt-1 w-full" value={editingQ.questionType ?? editingQ.answerType} onChange={(e) => setEditingQ({ ...editingQ, questionType: e.target.value as DNAQuestionType })}>{QUESTION_TYPES.map((t) => <option key={t} value={t}>{DNA_QUESTION_TYPE_LABELS[t]}</option>)}</select></div>
                <div><Label>Choices (pipe-separated)</Label><Input className="mt-1" value={(editingQ.choices ?? editingQ.options ?? []).join("|")} onChange={(e) => setEditingQ({ ...editingQ, choices: e.target.value.split("|").map((c) => c.trim()).filter(Boolean) })} /></div>
                <div><Label>Difficulty</Label><select className="auth-input mt-1 w-full" value={editingQ.difficulty} onChange={(e) => setEditingQ({ ...editingQ, difficulty: e.target.value as DNADifficulty })}>{(Object.keys(DNA_DIFFICULTY_LABELS) as DNADifficulty[]).map((d) => <option key={d} value={d}>{DNA_DIFFICULTY_LABELS[d]}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>XP</Label><Input type="number" className="mt-1" value={editingQ.xpReward} onChange={(e) => setEditingQ({ ...editingQ, xpReward: Number(e.target.value) })} /></div>
                  <div><Label>Bronze</Label><Input type="number" className="mt-1" value={editingQ.bronzeReward} onChange={(e) => setEditingQ({ ...editingQ, bronzeReward: Number(e.target.value) })} /></div>
                </div>
                <PortalButton variant="gold" className="w-full" onClick={saveQuestion}>Save Question</PortalButton>
                <PortalButton variant="secondary" className="w-full" onClick={() => setEditingQ(null)}>Cancel</PortalButton>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {tab === "modules" && (
        <div className="grid xl:grid-cols-[1fr_380px] gap-6">
          <GlassCard className="p-6">
            <PortalButton variant="gold" size="sm" className="mb-4" onClick={() => setEditingM({ id: `mod_${Date.now()}`, title: "", description: "", icon: "🧬", order: modules.length + 1, color: "#7c3aed", requiredLevel: 1, isActive: true, xpReward: 100, bronzeReward: 0, silverReward: 0, goldReward: 1, diamondReward: 0 })}>+ Create Module</PortalButton>
            <div className="space-y-3">
              {modules.map((m) => (
                <div key={m.id} className="rounded-xl border border-purple-500/15 bg-black/30 p-4 flex justify-between gap-3 flex-wrap">
                  <div><p className="font-bold text-white">{m.icon} {m.title}</p><p className="text-xs text-purple-400/50">{m.description}</p></div>
                  <div className="flex gap-2">
                    <PortalButton size="sm" variant="secondary" onClick={() => setEditingM({ ...m })}>Edit</PortalButton>
                    <PortalButton size="sm" variant="secondary" onClick={async () => { await adminFetch(`/api/admin/explorer-dna/modules/${m.id}`, { method: "DELETE" }); loadAll(); }}>Delete</PortalButton>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
          {editingM && (
            <GlassCard glow="gold" className="p-6 h-fit">
              <h2 className="font-bold text-white mb-4">Edit Module</h2>
              <div className="space-y-3">
                <div><Label>Title</Label><Input className="mt-1" value={editingM.title} onChange={(e) => setEditingM({ ...editingM, title: e.target.value })} /></div>
                <div><Label>Description</Label><Input className="mt-1" value={editingM.description} onChange={(e) => setEditingM({ ...editingM, description: e.target.value })} /></div>
                <div><Label>Icon</Label><Input className="mt-1" value={editingM.icon} onChange={(e) => setEditingM({ ...editingM, icon: e.target.value })} /></div>
                <PortalButton variant="gold" className="w-full" onClick={saveModule}>Save Module</PortalButton>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {tab === "import" && (
        <GlassCard className="p-6">
          <p className="text-purple-300/60 text-sm mb-4">Import JSON array of questions or export current database questions.</p>
          <textarea className="auth-input w-full min-h-[200px] mb-4" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='[{"moduleId":"skills","title":"Rate Python","questionType":"rating","difficulty":"medium"}]' />
          <div className="flex gap-3 flex-wrap">
            <PortalButton variant="gold" onClick={runImport}>Import JSON</PortalButton>
            <PortalButton variant="secondary" onClick={exportJson}>Export JSON</PortalButton>
            <a href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/admin/explorer-dna/questions/export?format=csv`} className="text-sm text-purple-300 underline" target="_blank" rel="noreferrer">Download CSV</a>
          </div>
        </GlassCard>
      )}
    </AdminPageShell>
  );
}
