"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import { adminFetch } from "@/lib/api";
import { DNA_QUESTION_TYPE_LABELS, DNA_CATEGORY_LABELS, DNA_DIFFICULTY_LABELS } from "@/data/explorer-dna-data";
import { cn } from "@/lib/utils";

type AdminDnaQuestion = {
  id: string;
  moduleId: string;
  title: string;
  prompt: string;
  questionType: string;
  choices: string[];
  required: boolean;
  difficulty: string;
  xpReward: number;
  bronzeCoinsReward: number;
  silverCoinsReward: number;
  goldCoinsReward: number;
  enabled: boolean;
  displayOrder: number;
};

type QuestionFormState = Omit<AdminDnaQuestion, "id"> & { id?: string };

const MODULE_IDS = Object.keys(DNA_CATEGORY_LABELS);
const DIFFICULTIES = Object.keys(DNA_DIFFICULTY_LABELS);
const QUESTION_TYPES = Object.keys(DNA_QUESTION_TYPE_LABELS);

const CHOICE_TYPES = new Set(["single_choice", "multiple_choice", "checkbox", "dropdown"]);

function normalizeQuestion(raw: Partial<AdminDnaQuestion>): AdminDnaQuestion {
  return {
    id: raw.id ?? "",
    moduleId: raw.moduleId ?? "continuous",
    title: raw.title || raw.prompt || "Untitled question",
    prompt: raw.prompt || raw.title || "",
    questionType: raw.questionType || "text",
    choices: Array.isArray(raw.choices) ? raw.choices : [],
    required: raw.required ?? false,
    difficulty: raw.difficulty || "simple",
    xpReward: raw.xpReward ?? 5,
    bronzeCoinsReward: raw.bronzeCoinsReward ?? 1,
    silverCoinsReward: raw.silverCoinsReward ?? 0,
    goldCoinsReward: raw.goldCoinsReward ?? 0,
    enabled: raw.enabled ?? true,
    displayOrder: raw.displayOrder ?? 0,
  };
}

function emptyQuestionForm(): QuestionFormState {
  return {
    moduleId: "continuous",
    title: "",
    prompt: "",
    questionType: "text",
    choices: [],
    required: false,
    difficulty: "simple",
    xpReward: 5,
    bronzeCoinsReward: 1,
    silverCoinsReward: 0,
    goldCoinsReward: 0,
    enabled: true,
    displayOrder: 0,
  };
}

function rewardSummary(q: AdminDnaQuestion): string {
  const parts = [`${q.xpReward} XP`];
  if (q.bronzeCoinsReward > 0) parts.push(`${q.bronzeCoinsReward} 🥉`);
  if (q.silverCoinsReward > 0) parts.push(`${q.silverCoinsReward} 🥈`);
  if (q.goldCoinsReward > 0) parts.push(`${q.goldCoinsReward} 🥇`);
  return parts.join(" · ");
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close modal"
        onClick={onClose}
      />
      <GlassCard glow="gold" className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border-amber-400/25">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} className="text-purple-400/60 hover:text-white text-sm">
            ✕
          </button>
        </div>
        {children}
      </GlassCard>
    </div>
  );
}

export default function AdminDnaQuestionsPage() {
  const [questions, setQuestions] = useState<AdminDnaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionFormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDnaQuestion | null>(null);
  const [choicesText, setChoicesText] = useState("");

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await adminFetch<AdminDnaQuestion[]>("/api/admin/dna-questions");
    if (res.success && Array.isArray(res.data)) {
      setQuestions(res.data.map((q) => normalizeQuestion(q)));
    } else {
      setQuestions([]);
      setError(res.error ?? "Failed to load DNA questions");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((item) => {
      if (moduleFilter !== "all" && item.moduleId !== moduleFilter) return false;
      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) return false;
      if (typeFilter !== "all" && item.questionType !== typeFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.prompt.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [questions, search, moduleFilter, difficultyFilter, typeFilter]);

  function openCreate() {
    setEditing(emptyQuestionForm());
    setChoicesText("");
    setFormOpen(true);
  }

  function openEdit(q: AdminDnaQuestion) {
    setEditing({ ...q });
    setChoicesText(q.choices.join("\n"));
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setChoicesText("");
  }

  async function saveQuestion() {
    if (!editing) return;
    const title = editing.title.trim() || editing.prompt.trim();
    if (!title) {
      setError("Question title is required");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const choices = CHOICE_TYPES.has(editing.questionType)
      ? choicesText
          .split("\n")
          .map((c) => c.trim())
          .filter(Boolean)
      : [];

    const payload = {
      moduleId: editing.moduleId,
      title,
      prompt: editing.prompt.trim() || title,
      questionType: editing.questionType,
      choices,
      required: editing.required,
      difficulty: editing.difficulty,
      xpReward: editing.xpReward,
      bronzeCoinsReward: editing.bronzeCoinsReward,
      silverCoinsReward: editing.silverCoinsReward,
      goldCoinsReward: editing.goldCoinsReward,
      enabled: editing.enabled,
      displayOrder: editing.displayOrder,
    };

    const isEdit = Boolean(editing.id);
    const res = isEdit
      ? await adminFetch<AdminDnaQuestion>(`/api/admin/dna-questions/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await adminFetch<AdminDnaQuestion>("/api/admin/dna-questions", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    setSaving(false);

    if (res.success) {
      await loadQuestions();
      setMessage(isEdit ? "Question updated" : "Question created");
      closeForm();
      setTimeout(() => setMessage(""), 3000);
    } else {
      setError(res.error ?? "Failed to save question");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    const res = await adminFetch(`/api/admin/dna-questions/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);

    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setMessage("Question deleted");
      setDeleteTarget(null);
      setTimeout(() => setMessage(""), 2500);
    } else {
      setError(res.error ?? "Failed to delete question");
    }
  }

  async function toggleEnabled(q: AdminDnaQuestion) {
    const res = await adminFetch<AdminDnaQuestion>(`/api/admin/dna-questions/${q.id}`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: !q.enabled }),
    });
    if (res.success && res.data) {
      setQuestions((prev) => prev.map((item) => (item.id === q.id ? normalizeQuestion(res.data!) : item)));
    } else {
      setError(res.error ?? "Failed to update status");
    }
  }

  const tableRows = filtered.map((q) => [
    <span key={`order-${q.id}`} className="tabular-nums text-purple-300/70">{q.displayOrder}</span>,
    <div key={`title-${q.id}`}>
      <p className="font-medium text-white">{q.title}</p>
      <p className="text-[10px] text-purple-400/45 truncate max-w-[220px]">{q.prompt}</p>
    </div>,
    <span key={`mod-${q.id}`} className="text-xs">{DNA_CATEGORY_LABELS[q.moduleId] ?? q.moduleId}</span>,
    <span key={`type-${q.id}`} className="text-xs">{DNA_QUESTION_TYPE_LABELS[q.questionType] ?? q.questionType}</span>,
    <span key={`diff-${q.id}`} className="text-xs capitalize">{DNA_DIFFICULTY_LABELS[q.difficulty as keyof typeof DNA_DIFFICULTY_LABELS] ?? q.difficulty}</span>,
    <span key={`rew-${q.id}`} className="text-xs text-amber-300/90">{rewardSummary(q)}</span>,
    <span
      key={`st-${q.id}`}
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
        q.enabled ? "border-emerald-400/40 text-emerald-300 bg-emerald-950/30" : "border-red-400/40 text-red-300 bg-red-950/30"
      )}
    >
      {q.enabled ? "Enabled" : "Disabled"}
    </span>,
    <div key={`act-${q.id}`} className="flex flex-wrap gap-1.5">
      <PortalButton size="sm" variant="secondary" onClick={() => openEdit(q)}>
        Edit
      </PortalButton>
      <PortalButton size="sm" variant="secondary" onClick={() => toggleEnabled(q)}>
        {q.enabled ? "Disable" : "Enable"}
      </PortalButton>
      <PortalButton size="sm" variant="secondary" onClick={() => setDeleteTarget(q)}>
        Delete
      </PortalButton>
    </div>,
  ]);

  return (
    <AdminPageShell
      title="DNA Questions"
      subtitle="Create and manage Explorer DNA questions — database only"
      action={
        <PortalButton variant="gold" onClick={openCreate}>
          + New Question
        </PortalButton>
      }
      stats={[
        { label: "Total", value: questions.length, icon: "🧬" },
        { label: "Enabled", value: questions.filter((q) => q.enabled).length, icon: "✅" },
        { label: "Disabled", value: questions.filter((q) => !q.enabled).length, icon: "⏸" },
        { label: "Modules", value: new Set(questions.map((q) => q.moduleId)).size, icon: "📂" },
      ]}
    >
      {message && (
        <p className="mb-4 rounded-lg border border-emerald-400/30 bg-emerald-950/25 px-4 py-2 text-sm text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-400/30 bg-red-950/25 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <GlassCard className="p-4 mb-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-purple-400/50">Search</Label>
            <Input
              className="mt-1"
              placeholder="Title, prompt, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-purple-400/50">Module</Label>
            <select className="auth-input mt-1 w-full" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option value="all">All modules</option>
              {MODULE_IDS.map((id) => (
                <option key={id} value={id}>
                  {DNA_CATEGORY_LABELS[id]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-purple-400/50">Difficulty</Label>
            <select className="auth-input mt-1 w-full" value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
              <option value="all">All difficulties</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {DNA_DIFFICULTY_LABELS[d as keyof typeof DNA_DIFFICULTY_LABELS]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-purple-400/50">Question type</Label>
            <select className="auth-input mt-1 w-full" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              {QUESTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DNA_QUESTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {loading ? (
        <GlassCard className="p-10 text-center text-purple-400/60 text-sm">Loading DNA questions…</GlassCard>
      ) : questions.length === 0 && !error ? (
        <GlassCard className="p-12 text-center">
          <p className="text-purple-300/70 text-sm">No DNA questions available yet.</p>
          <PortalButton variant="gold" className="mt-4" onClick={openCreate}>
            Create first question
          </PortalButton>
        </GlassCard>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center text-purple-400/60 text-sm">No questions match your filters.</GlassCard>
      ) : (
        <AdminTable
          headers={["Order", "Question", "Module", "Type", "Difficulty", "Rewards", "Status", "Actions"]}
          rows={tableRows}
        />
      )}

      <Modal open={formOpen && Boolean(editing)} title={editing?.id ? "Edit DNA Question" : "Create DNA Question"} onClose={closeForm}>
        {editing && (
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                className="mt-1"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value, prompt: e.target.value })}
                placeholder="Question title"
              />
            </div>
            <div>
              <Label>Prompt (optional detail)</Label>
              <textarea
                className="auth-input mt-1 w-full min-h-[72px] resize-none"
                value={editing.prompt}
                onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
                placeholder="Extended prompt shown to explorers"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Module</Label>
                <select
                  className="auth-input mt-1 w-full"
                  value={editing.moduleId}
                  onChange={(e) => setEditing({ ...editing, moduleId: e.target.value })}
                >
                  {MODULE_IDS.map((id) => (
                    <option key={id} value={id}>
                      {DNA_CATEGORY_LABELS[id]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <select
                  className="auth-input mt-1 w-full"
                  value={editing.difficulty}
                  onChange={(e) => setEditing({ ...editing, difficulty: e.target.value })}
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {DNA_DIFFICULTY_LABELS[d as keyof typeof DNA_DIFFICULTY_LABELS]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Question type</Label>
              <select
                className="auth-input mt-1 w-full"
                value={editing.questionType}
                onChange={(e) => setEditing({ ...editing, questionType: e.target.value })}
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DNA_QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            {CHOICE_TYPES.has(editing.questionType) && (
              <div>
                <Label>Choices (one per line)</Label>
                <textarea
                  className="auth-input mt-1 w-full min-h-[88px] resize-none font-mono text-xs"
                  value={choicesText}
                  onChange={(e) => setChoicesText(e.target.value)}
                  placeholder={"Option A\nOption B\nOption C"}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Display order</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={editing.displayOrder}
                  onChange={(e) => setEditing({ ...editing, displayOrder: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-purple-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editing.required}
                    onChange={(e) => setEditing({ ...editing, required: e.target.checked })}
                    className="accent-amber-400"
                  />
                  Required question
                </label>
              </div>
            </div>
            <div className="rounded-xl border border-amber-400/20 bg-amber-950/15 p-3">
              <p className="text-[10px] uppercase tracking-wider text-amber-300/70 font-bold mb-2">Rewards</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>XP</Label>
                  <Input type="number" min={0} className="mt-1" value={editing.xpReward} onChange={(e) => setEditing({ ...editing, xpReward: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Bronze coins</Label>
                  <Input type="number" min={0} className="mt-1" value={editing.bronzeCoinsReward} onChange={(e) => setEditing({ ...editing, bronzeCoinsReward: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Silver coins</Label>
                  <Input type="number" min={0} className="mt-1" value={editing.silverCoinsReward} onChange={(e) => setEditing({ ...editing, silverCoinsReward: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Gold coins</Label>
                  <Input type="number" min={0} className="mt-1" value={editing.goldCoinsReward} onChange={(e) => setEditing({ ...editing, goldCoinsReward: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-purple-200 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                className="accent-amber-400"
              />
              Enabled
            </label>
            <div className="flex gap-2 pt-2">
              <PortalButton variant="gold" className="flex-1" onClick={saveQuestion} disabled={saving}>
                {saving ? "Saving…" : editing.id ? "Update Question" : "Create Question"}
              </PortalButton>
              <PortalButton variant="secondary" onClick={closeForm}>
                Cancel
              </PortalButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(deleteTarget)} title="Delete DNA Question" onClose={() => setDeleteTarget(null)}>
        {deleteTarget && (
          <div>
            <p className="text-sm text-purple-200/80 mb-6">
              Permanently delete <span className="font-semibold text-white">{deleteTarget.title}</span>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <PortalButton variant="gold" className="flex-1 bg-red-900/40 border-red-400/40" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </PortalButton>
              <PortalButton variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </PortalButton>
            </div>
          </div>
        )}
      </Modal>
    </AdminPageShell>
  );
}
