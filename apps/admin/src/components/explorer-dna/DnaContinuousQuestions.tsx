"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import type { DNAQuestionType, IDNAQuestion } from "@tasks-cash/types";
import { DNA_CATEGORY_LABELS } from "@/data/explorer-dna-data";

interface DnaContinuousQuestionsProps {
  questions: IDNAQuestion[];
  onAnswer?: (questionId: string, value: string | string[] | number) => void;
}

function hasAnswerValue(type: DNAQuestionType, answer: string | string[], sliderTouched: boolean): boolean {
  if (type === "slider") return sliderTouched;
  if (type === "multiple_choice" || type === "checkbox") return Array.isArray(answer) && answer.length > 0;
  if (type === "rating") return answer !== "";
  return typeof answer === "string" && answer.trim().length > 0;
}

function normalizeValue(type: DNAQuestionType, answer: string | string[]): string | string[] | number {
  if (type === "slider" || type === "rating") return Number(answer);
  if (type === "multiple_choice" || type === "checkbox") return answer;
  return typeof answer === "string" ? answer.trim() : answer;
}

export function DnaContinuousQuestions({ questions, onAnswer }: DnaContinuousQuestionsProps) {
  const pending = useMemo(() => questions.filter((q) => q.enabled && q.isNew), [questions]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answer, setAnswer] = useState<string | string[]>("");
  const [sliderTouched, setSliderTouched] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [success, setSuccess] = useState("");

  const current = pending[activeIndex];

  function toggleMulti(value: string) {
    setAnswer((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    });
  }

  function handleSubmit() {
    if (!current) return;
    if (!hasAnswerValue(current.answerType, answer, sliderTouched)) return;

    const value = normalizeValue(current.answerType, answer);
    setSubmitted((prev) => [...prev, current.id]);
    onAnswer?.(current.id, value);
    setSuccess(`+${current.xpReward} XP · DNA intelligence increased`);
    setAnswer("");
    setSliderTouched(false);
    setActiveIndex((i) => Math.min(i + 1, pending.length - 1));
    setTimeout(() => setSuccess(""), 3000);
  }

  if (pending.length === 0) {
    return (
      <GlassCard className="p-6 mb-10 text-center text-purple-400/50">
        All current DNA questions answered. New questions arrive as the platform learns more about you.
      </GlassCard>
    );
  }

  const q = current;
  if (!q || submitted.includes(q.id)) {
    const next = pending.find((item) => !submitted.includes(item.id));
    if (!next) {
      return (
        <GlassCard glow="gold" className="p-6 mb-10 text-center">
          <p className="text-emerald-400 font-bold">All new DNA questions completed!</p>
          <p className="text-purple-400/50 text-sm mt-2">Check back soon — Explorer DNA never finishes.</p>
        </GlassCard>
      );
    }
  }

  const displayQ = pending.find((item) => !submitted.includes(item.id)) ?? q;
  const canSubmit = displayQ ? hasAnswerValue(displayQ.answerType, answer, sliderTouched) : false;

  return (
    <section className="mb-10 md:mb-14">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.4em] text-purple-400/50 font-bold mb-2">Continuous Learning</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">New DNA Question Available</h2>
          <p className="text-sm text-purple-300/55 mt-2">Answer one question at a time. Each answer improves your mission recommendations.</p>
        </div>
        {pending.length > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-300">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {pending.filter((item) => !submitted.includes(item.id)).length} Available
          </span>
        )}
      </div>

      {success && <p className="text-emerald-400 text-sm mb-4">{success}</p>}

      {displayQ && !submitted.includes(displayQ.id) && (
        <motion.div key={displayQ.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard glow="violet" className="p-6 md:p-8 border-violet-400/25">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="rounded-md border border-purple-500/25 bg-purple-950/40 px-2 py-0.5 text-[10px] text-purple-300">
                {DNA_CATEGORY_LABELS[displayQ.category] ?? displayQ.category}
              </span>
              <span className="rounded-md border border-amber-400/25 bg-amber-950/30 px-2 py-0.5 text-[10px] text-amber-300">
                +{displayQ.xpReward} XP
              </span>
              {(displayQ.coinReward ?? 0) > 0 && (
                <span className="rounded-md border border-yellow-400/25 bg-yellow-950/30 px-2 py-0.5 text-[10px] text-yellow-300">
                  +{displayQ.coinReward} Coins
                </span>
              )}
            </div>

            <h3 className="text-lg md:text-xl font-black text-white mb-4">{displayQ.prompt}</h3>

            {displayQ.answerType === "single_choice" && displayQ.options ? (
              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                {displayQ.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAnswer(opt)}
                    className={`rounded-xl border px-4 py-3 text-sm text-left transition-all ${
                      answer === opt
                        ? "border-amber-400/50 bg-amber-950/40 text-amber-200"
                        : "border-purple-500/20 bg-black/30 text-purple-200 hover:border-purple-400/40"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : displayQ.answerType === "multiple_choice" && displayQ.options ? (
              <div className="grid sm:grid-cols-2 gap-2 mb-4">
                {displayQ.options.map((opt) => {
                  const selected = Array.isArray(answer) && answer.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleMulti(opt)}
                      className={`rounded-xl border px-4 py-3 text-sm text-left transition-all ${
                        selected
                          ? "border-amber-400/50 bg-amber-950/40 text-amber-200"
                          : "border-purple-500/20 bg-black/30 text-purple-200 hover:border-purple-400/40"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : displayQ.answerType === "checkbox" && displayQ.options ? (
              <div className="space-y-2 mb-4">
                {displayQ.options.map((opt) => {
                  const selected = Array.isArray(answer) && answer.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-all ${
                        selected
                          ? "border-amber-400/50 bg-amber-950/40 text-amber-200"
                          : "border-purple-500/20 bg-black/30 text-purple-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMulti(opt)}
                        className="accent-amber-400"
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            ) : displayQ.answerType === "dropdown" && displayQ.options ? (
              <select
                className="auth-input w-full mb-4"
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => setAnswer(e.target.value)}
              >
                <option value="">Select an option…</option>
                {displayQ.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : displayQ.answerType === "slider" ? (
              <div className="mb-4">
                <Label>Hours per week: {typeof answer === "string" && answer ? answer : "0"}</Label>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={typeof answer === "string" && answer ? answer : "0"}
                  onChange={(e) => {
                    setSliderTouched(true);
                    setAnswer(e.target.value);
                  }}
                  className="w-full mt-2 accent-amber-400"
                />
              </div>
            ) : displayQ.answerType === "rating" ? (
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(String(n))}
                    className={`h-10 w-10 rounded-lg border font-bold ${
                      answer === String(n) ? "border-amber-400 bg-amber-950/40 text-amber-300" : "border-purple-500/20 text-purple-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : displayQ.answerType === "paragraph" ? (
              <textarea
                className="auth-input w-full min-h-[120px] mb-4"
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Share your answer in detail…"
              />
            ) : displayQ.answerType === "date" ? (
              <Input
                type="date"
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => setAnswer(e.target.value)}
                className="mb-4"
              />
            ) : displayQ.answerType === "file_upload" ? (
              <Input
                type="file"
                className="mb-4"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setAnswer(file?.name ?? "");
                }}
              />
            ) : (
              <Input
                value={typeof answer === "string" ? answer : ""}
                onChange={(e) => setAnswer(e.target.value)}
                className="mb-4"
                placeholder="Your answer…"
              />
            )}

            <PortalButton variant="gold" onClick={handleSubmit} disabled={!canSubmit}>
              Submit DNA Answer
            </PortalButton>
          </GlassCard>
        </motion.div>
      )}
    </section>
  );
}
