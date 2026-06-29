"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import type { IDNAQuestion, DNAQuestionType } from "@tasks-cash/types";
import { adminFetch } from "@/lib/api";
import {
  ADMIN_DNA_QUESTIONS,
  DNA_QUESTION_TYPE_LABELS,
  DNA_CATEGORY_LABELS,
} from "@/data/explorer-dna-data";

const ANSWER_TYPES: DNAQuestionType[] = [
  "short_text",
  "paragraph",
  "single_choice",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "slider",
  "rating",
  "date",
  "file_upload",
];

const emptyQuestion = (): IDNAQuestion => ({
  id: `q_${Date.now()}`,
  prompt: "",
  category: "continuous",
  answerType: "single_choice",
  options: ["Option A", "Option B"],
  xpReward: 50,
  coinReward: 0,
  enabled: true,
  order: 99,
});

export default function AdminExplorerDnaPage() {
  const [questions, setQuestions] = useState<IDNAQuestion[]>([]);
  const [editing, setEditing] = useState<IDNAQuestion | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    setError("");
    const res = await adminFetch<IDNAQuestion[]>("/api/admin/explorer-dna/questions");
    if (res.success && res.data) {
      setQuestions(res.data);
    } else {
      setQuestions(ADMIN_DNA_QUESTIONS);
      if (res.error) setError(`${res.error} — showing fallback data`);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  async function saveQuestion() {
    if (!editing?.prompt.trim()) return;
    setSaving(true);
    setMessage("");
    setError("");

    const exists = questions.some((q) => q.id === editing.id);
    const res = exists
      ? await adminFetch<IDNAQuestion>(`/api/admin/explorer-dna/questions/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(editing),
        })
      : await adminFetch<IDNAQuestion>("/api/admin/explorer-dna/questions", {
          method: "POST",
          body: JSON.stringify(editing),
        });

    setSaving(false);
    if (res.success && res.data) {
      setQuestions((prev) => {
        const idx = prev.findIndex((q) => q.id === res.data!.id);
        if (idx >= 0) return prev.map((q) => (q.id === res.data!.id ? res.data! : q));
        return [...prev, res.data!].sort((a, b) => a.order - b.order);
      });
      setMessage("DNA question saved");
      setEditing(null);
      setTimeout(() => setMessage(""), 3000);
    } else {
      setError(res.error ?? "Failed to save question");
    }
  }

  async function deleteQuestion(id: string) {
    const res = await adminFetch(`/api/admin/explorer-dna/questions/${id}`, { method: "DELETE" });
    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setMessage("Question deleted");
      setTimeout(() => setMessage(""), 2000);
    } else {
      setError(res.error ?? "Failed to delete question");
    }
  }

  async function toggleEnabled(id: string) {
    const question = questions.find((q) => q.id === id);
    if (!question) return;
    const res = await adminFetch<IDNAQuestion>(`/api/admin/explorer-dna/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ enabled: !question.enabled }),
    });
    if (res.success && res.data) {
      setQuestions((prev) => prev.map((q) => (q.id === id ? res.data! : q)));
    } else {
      setError(res.error ?? "Failed to update question");
    }
  }

  async function moveQuestion(id: string, direction: "up" | "down") {
    const idx = questions.findIndex((q) => q.id === id);
    if (idx < 0) return;
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= questions.length) return;

    const next = [...questions];
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const orderedIds = next.map((q) => q.id);

    const res = await adminFetch<IDNAQuestion[]>("/api/admin/explorer-dna/questions/reorder", {
      method: "POST",
      body: JSON.stringify({ orderedIds }),
    });

    if (res.success && res.data) {
      setQuestions(res.data);
    } else {
      setQuestions(next.map((q, i) => ({ ...q, order: i + 1 })));
    }
  }

  return (
    <AdminPageShell
      title="Explorer DNA"
      subtitle="Create unlimited DNA questions — the platform continuously learns about each explorer"
      stats={[
        { label: "Total Questions", value: questions.length, icon: "🧬" },
        { label: "Enabled", value: questions.filter((q) => q.enabled).length, icon: "✅" },
        { label: "Disabled", value: questions.filter((q) => !q.enabled).length, icon: "⏸" },
        { label: "Categories", value: new Set(questions.map((q) => q.category)).size, icon: "📂" },
      ]}
    >
      {loading && <p className="text-purple-400/60 text-sm mb-4">Loading DNA questions…</p>}
      {message && <p className="text-emerald-400 text-sm mb-4">{message}</p>}
      {error && <p className="text-amber-300 text-sm mb-4">{error}</p>}

      <div className="grid xl:grid-cols-[1fr_400px] gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h2 className="font-bold text-white">DNA Questions</h2>
            <PortalButton variant="gold" size="sm" onClick={() => setEditing(emptyQuestion())}>
              + Create Question
            </PortalButton>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {questions.map((q) => (
              <div key={q.id} className="rounded-xl border border-purple-500/15 bg-black/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-white">{q.prompt}</p>
                    <p className="text-[10px] text-purple-400/50 mt-1">
                      {DNA_CATEGORY_LABELS[q.category]} · {DNA_QUESTION_TYPE_LABELS[q.answerType]} · +{q.xpReward} XP
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold ${q.enabled ? "text-emerald-400" : "text-red-400"}`}>
                    {q.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PortalButton size="sm" variant="secondary" onClick={() => setEditing({ ...q })}>
                    Edit
                  </PortalButton>
                  <PortalButton size="sm" variant="secondary" onClick={() => toggleEnabled(q.id)}>
                    {q.enabled ? "Disable" : "Enable"}
                  </PortalButton>
                  <PortalButton size="sm" variant="secondary" onClick={() => moveQuestion(q.id, "up")}>
                    ↑
                  </PortalButton>
                  <PortalButton size="sm" variant="secondary" onClick={() => moveQuestion(q.id, "down")}>
                    ↓
                  </PortalButton>
                  <PortalButton size="sm" variant="secondary" onClick={() => deleteQuestion(q.id)}>
                    Delete
                  </PortalButton>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {editing && (
          <GlassCard glow="gold" className="p-6 h-fit sticky top-6">
            <h2 className="font-bold text-white mb-4">{questions.some((q) => q.id === editing.id) ? "Edit" : "Create"} DNA Question</h2>
            <div className="space-y-3">
              <div>
                <Label>Question prompt</Label>
                <Input
                  className="mt-1"
                  value={editing.prompt}
                  onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  className="auth-input mt-1 w-full"
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value as IDNAQuestion["category"] })}
                >
                  {Object.entries(DNA_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Answer type</Label>
                <select
                  className="auth-input mt-1 w-full"
                  value={editing.answerType}
                  onChange={(e) => setEditing({ ...editing, answerType: e.target.value as DNAQuestionType })}
                >
                  {ANSWER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {DNA_QUESTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>XP reward</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={editing.xpReward}
                  onChange={(e) => setEditing({ ...editing, xpReward: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Coin reward</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={editing.coinReward ?? 0}
                  onChange={(e) => setEditing({ ...editing, coinReward: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Unlock condition (optional)</Label>
                <Input
                  className="mt-1"
                  value={editing.unlockCondition ?? ""}
                  onChange={(e) => setEditing({ ...editing, unlockCondition: e.target.value })}
                  placeholder="e.g. completion >= 50%"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <PortalButton variant="gold" className="flex-1" onClick={saveQuestion} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </PortalButton>
                <PortalButton variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </PortalButton>
              </div>
            </div>
          </GlassCard>
        )}
      </div>
    </AdminPageShell>
  );
}
