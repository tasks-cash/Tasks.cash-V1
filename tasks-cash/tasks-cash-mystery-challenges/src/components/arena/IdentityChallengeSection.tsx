"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { apiFetch } from "@/lib/api/client";
import { buildMainLoginUrl } from "@/lib/auth/redirect";
import type {
  IdentityChallengePayload,
  IdentityChallengeProgress,
  IdentityQuestion,
  IdentityQuestionType,
} from "@/types/identity-challenge";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "ready" | "empty" | "error" | "complete" | "unauthorized";

interface NormalizedQuestion {
  id: string;
  title: string;
  prompt: string;
  questionType: IdentityQuestionType;
  options: string[];
  xpReward: number;
  bronzeCoinsReward: number;
  silverCoinsReward: number;
  goldCoinsReward: number;
  answered: boolean;
  answer?: string;
}

function normalizeQuestionType(value?: string): IdentityQuestionType {
  if (value === "single_choice" || value === "multiple_choice" || value === "slider") {
    return value;
  }
  if (value === "text" || value === "short_text" || !value) {
    return "short_text";
  }
  return "short_text";
}

function normalizeQuestion(raw: Partial<IdentityQuestion> & { id?: string }): NormalizedQuestion | null {
  const id = raw.id?.trim();
  if (!id) return null;

  const title = raw.title?.trim() || raw.prompt?.trim() || "Untitled question";
  const prompt = raw.prompt?.trim() || raw.title?.trim() || title;

  return {
    id,
    title,
    prompt,
    questionType: normalizeQuestionType(raw.questionType),
    options: Array.isArray(raw.options) ? raw.options.filter((o) => typeof o === "string" && o.trim()) : [],
    xpReward: Number(raw.xpReward) || 0,
    bronzeCoinsReward: Number(raw.bronzeCoinsReward) || 0,
    silverCoinsReward: Number(raw.silverCoinsReward) || 0,
    goldCoinsReward: Number(raw.goldCoinsReward) || 0,
    answered: Boolean(raw.answered),
    answer: typeof raw.answer === "string" ? raw.answer : undefined,
  };
}

function normalizePayload(data: IdentityChallengePayload | undefined): {
  questions: NormalizedQuestion[];
  progress: IdentityChallengeProgress;
} {
  const rawQuestions = Array.isArray(data?.questions) ? data.questions : [];
  const questions = rawQuestions
    .map((q) => normalizeQuestion(q))
    .filter((q): q is NormalizedQuestion => q !== null);

  const answered = questions.filter((q) => q.answered).length;
  const total = questions.length;

  return {
    questions,
    progress: {
      answered: Number(data?.progress?.answered) || answered,
      total: Number(data?.progress?.total) || total,
    },
  };
}

function formatRewardPreview(q: NormalizedQuestion): string {
  const parts: string[] = [];
  if (q.xpReward > 0) parts.push(`+${q.xpReward} XP`);
  if (q.bronzeCoinsReward > 0) parts.push(`+${q.bronzeCoinsReward} Bronze`);
  if (q.silverCoinsReward > 0) parts.push(`+${q.silverCoinsReward} Silver`);
  if (q.goldCoinsReward > 0) parts.push(`+${q.goldCoinsReward} Gold`);
  return parts.length > 0 ? parts.join(" · ") : "No reward configured";
}

function formatRewardToast(rewards: {
  xp?: number;
  bronzeCoins?: number;
  silverCoins?: number;
  goldCoins?: number;
}): string {
  const parts: string[] = [];
  const xp = Number(rewards.xp) || 0;
  const bronze = Number(rewards.bronzeCoins) || 0;
  const silver = Number(rewards.silverCoins) || 0;
  const gold = Number(rewards.goldCoins) || 0;
  if (xp > 0) parts.push(`+${xp} XP`);
  if (bronze > 0) parts.push(`+${bronze} Bronze`);
  if (silver > 0) parts.push(`+${silver} Silver`);
  if (gold > 0) parts.push(`+${gold} Gold`);
  return parts.length > 0 ? parts.join(" · ") : "Answer saved";
}

function RewardChips({ q }: { q: NormalizedQuestion }) {
  const chips: { icon: string; label: string }[] = [];
  if (q.xpReward > 0) chips.push({ icon: "✨", label: `+${q.xpReward} XP` });
  if (q.bronzeCoinsReward > 0) chips.push({ icon: "🥉", label: `+${q.bronzeCoinsReward} Bronze` });
  if (q.silverCoinsReward > 0) chips.push({ icon: "🥈", label: `+${q.silverCoinsReward} Silver` });
  if (q.goldCoinsReward > 0) chips.push({ icon: "🥇", label: `+${q.goldCoinsReward} Gold` });
  if (chips.length === 0) chips.push({ icon: "—", label: "No reward configured" });
  return (
    <div className="ic-reward-row">
      {chips.map((chip) => (
        <span key={chip.label} className="ic-reward-chip">
          <span aria-hidden>{chip.icon}</span>
          {chip.label}
        </span>
      ))}
    </div>
  );
}

interface IdentityChallengeSectionProps {
  /** `page` = full-route AAA layout for /identity-challenge only */
  variant?: "embedded" | "page";
}

export function IdentityChallengeSection({ variant = "embedded" }: IdentityChallengeSectionProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [questions, setQuestions] = useState<NormalizedQuestion[]>([]);
  const [progress, setProgress] = useState<IdentityChallengeProgress>({ answered: 0, total: 0 });
  const [answer, setAnswer] = useState<string | string[]>("");
  const [submitting, setSubmitting] = useState(false);
  const [rewardToast, setRewardToast] = useState("");

  const current = useMemo(
    () => questions.find((q) => !q.answered) ?? null,
    [questions]
  );

  const pct = progress.total > 0 ? Math.round((progress.answered / progress.total) * 100) : 0;
  const isComplete = progress.total > 0 && progress.answered >= progress.total;

  const loadQuestions = useCallback(async (silent = false): Promise<boolean> => {
    if (!silent) {
      setLoadState("loading");
      setErrorMessage("");
    }

    try {
      const res = await fetch("/api/identity-challenge/questions", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        data?: IdentityChallengePayload;
        error?: string;
      };

      if (res.status === 401) {
        setLoadState("unauthorized");
        if (typeof window !== "undefined") {
          window.location.href = buildMainLoginUrl(window.location.href);
        }
        return false;
      }

      if (!res.ok || !json.success || !json.data) {
        setQuestions([]);
        setProgress({ answered: 0, total: 0 });
        setLoadState("error");
        setErrorMessage("Unable to load identity questions.");
        return false;
      }

      const normalized = normalizePayload(json.data);
      setQuestions(normalized.questions);
      setProgress(normalized.progress);

      if (normalized.questions.length === 0) {
        setLoadState("empty");
        return true;
      }

      if (normalized.progress.total > 0 && normalized.progress.answered >= normalized.progress.total) {
        setLoadState("complete");
        return true;
      }

      setLoadState("ready");
      return true;
    } catch {
      setQuestions([]);
      setProgress({ answered: 0, total: 0 });
      setLoadState("error");
      setErrorMessage("Unable to load identity questions.");
      return false;
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (!current) {
      setAnswer("");
      return;
    }
    if (current.questionType === "multiple_choice") {
      setAnswer([]);
    } else if (current.questionType === "slider") {
      setAnswer("4");
    } else {
      setAnswer("");
    }
  }, [current?.id, current?.questionType]);

  function toggleMulti(value: string) {
    setAnswer((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    });
  }

  function hasValidAnswer(): boolean {
    if (!current) return false;
    if (current.questionType === "multiple_choice") {
      return Array.isArray(answer) && answer.length > 0;
    }
    if (current.questionType === "slider") {
      return typeof answer === "string" && answer.length > 0;
    }
    return typeof answer === "string" && answer.trim().length > 0;
  }

  function serializeAnswer(): string {
    if (Array.isArray(answer)) return answer.join(", ");
    return String(answer).trim();
  }

  async function handleSubmit() {
    if (!current || !hasValidAnswer() || submitting) return;

    setSubmitting(true);
    setRewardToast("");
    setErrorMessage("");

    const res = await apiFetch<{
      rewardClaimed: boolean;
      rewards: { xp: number; bronzeCoins: number; silverCoins: number; goldCoins: number };
      progress: IdentityChallengeProgress;
    }>("/api/identity-challenge/answers", {
      method: "POST",
      body: JSON.stringify({ questionId: current.id, answer: serializeAnswer() }),
    });

    setSubmitting(false);

    if (!res.success || !res.data) {
      if (res.error?.toLowerCase().includes("unauthorized")) {
        window.location.href = buildMainLoginUrl(window.location.href);
        return;
      }
      setErrorMessage(res.error ?? "Unable to save your answer. Please try again.");
      return;
    }

    setProgress({
      answered: Number(res.data.progress?.answered) || 0,
      total: Number(res.data.progress?.total) || progress.total,
    });

    if (res.data.rewardClaimed) {
      setRewardToast(formatRewardToast(res.data.rewards));
      setTimeout(() => setRewardToast(""), 4000);
    }

    const ok = await loadQuestions(true);
    if (!ok) return;

    const nextProgress = res.data.progress;
    if (
      nextProgress &&
      nextProgress.total > 0 &&
      nextProgress.answered >= nextProgress.total
    ) {
      setLoadState("complete");
    }
  }

  const answerBlock = current ? (
    <AnimatePresence mode="wait">
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35 }}
      >
        <p className={variant === "page" ? "ic-label mb-2" : "text-[10px] uppercase tracking-[0.3em] text-violet-300/60 font-bold mb-2"}>
          {current.title}
        </p>
        <h2 className={variant === "page" ? "ic-question-prompt mb-6" : "text-xl md:text-3xl font-black text-white mb-6"}>
          {current.prompt}
        </h2>

        {current.questionType === "single_choice" && current.options.length > 0 && (
          <div className={cn("grid gap-3 mb-6", variant === "page" ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {current.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setAnswer(opt)}
                className={cn(
                  variant === "page" ? "ic-option" : "rounded-xl border px-4 py-3.5 text-sm text-left transition-all",
                  variant === "page"
                    ? answer === opt && "ic-option-active"
                    : answer === opt
                      ? "border-amber-400/50 bg-amber-950/40 text-amber-100"
                      : "border-purple-500/20 bg-black/40 text-purple-200 hover:border-purple-400/35"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {current.questionType === "multiple_choice" && current.options.length > 0 && (
          <div className={cn("grid gap-3 mb-6", variant === "page" ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
            {current.options.map((opt) => {
              const selected = Array.isArray(answer) && answer.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleMulti(opt)}
                  className={cn(
                    variant === "page" ? "ic-option" : "rounded-xl border px-4 py-3.5 text-sm text-left transition-all",
                    variant === "page"
                      ? selected && "ic-option-active"
                      : selected
                        ? "border-amber-400/50 bg-amber-950/40 text-amber-100"
                        : "border-purple-500/20 bg-black/40 text-purple-200 hover:border-purple-400/35"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {current.questionType === "slider" && (
          <div className={cn("mb-6 rounded-xl border border-purple-500/20 bg-black/40 p-5", variant === "page" && "border-0 bg-black/30")}>
            <p className="text-sm md:text-base text-purple-300/70 mb-3">
              Hours per day:{" "}
              <span className="text-amber-300 font-bold">{typeof answer === "string" ? answer : "0"}</span>
            </p>
            <input
              type="range"
              min={1}
              max={16}
              value={typeof answer === "string" ? answer : "4"}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full accent-amber-400 h-2"
            />
          </div>
        )}

        {current.questionType === "short_text" && (
          <textarea
            value={typeof answer === "string" ? answer : ""}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder="Type your answer…"
            className={cn(
              variant === "page"
                ? "ic-textarea mb-6"
                : "w-full rounded-xl border border-purple-500/30 bg-black/50 px-5 py-4 text-white placeholder:text-purple-400/30 focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/30 mb-6 resize-none"
            )}
          />
        )}
      </motion.div>
    </AnimatePresence>
  ) : null;

  if (variant === "page") {
    return (
      <section id="identity-challenge" className="identity-challenge-page w-full min-h-screen min-h-[100dvh]">
        <div className="ic-ambient" aria-hidden>
          <div className="ic-ambient-ring" />
          <div className="ic-ambient-glow" />
        </div>

        <div className="ic-shell">
          <motion.header
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 md:mb-12"
          >
            <span className="ic-hero-badge mb-4">
              <span className="ic-hero-badge-dot" />
              Portal Verification · Mode 03
            </span>
            <h1 className="ic-title mb-4">Identity Challenge</h1>
            <p className="ic-subtitle">
              Answer identity questions from the portal database. Each verified answer unlocks rewards once per question
              and sharpens your explorer profile.
            </p>
          </motion.header>

          {loadState === "loading" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ic-card">
              <div className="ic-card-body ic-state">
                <span className="ic-state-icon">🎭</span>
                <p className="ic-state-title">Loading Identity Portal</p>
                <p className="ic-state-text">Fetching your questions and progress…</p>
              </div>
            </motion.div>
          )}

          {loadState === "error" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ic-card ic-card-gold">
              <div className="ic-card-body ic-state">
                <span className="ic-state-icon">⚠️</span>
                <p className="ic-state-title">Connection Interrupted</p>
                <p className="ic-state-text mb-6">{errorMessage || "Unable to load identity questions."}</p>
                <div className="ic-nav justify-center">
                  <button type="button" className="ic-btn-primary" onClick={() => void loadQuestions()}>
                    Retry
                  </button>
                  <a href="/" className="ic-btn-secondary">
                    Back to Arena
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {loadState === "empty" && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ic-card">
              <div className="ic-card-body ic-state">
                <span className="ic-state-icon">🎭</span>
                <p className="ic-state-title">No Questions Yet</p>
                <p className="ic-state-text mb-6">Identity questions will appear here when the admin publishes them.</p>
                <a href="/" className="ic-btn-secondary">
                  Back to Arena
                </a>
              </div>
            </motion.div>
          )}

          {loadState === "complete" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="ic-card ic-card-gold"
            >
              <div className="ic-card-body ic-state">
                <motion.span
                  className="ic-state-icon block"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  👑
                </motion.span>
                <p className="ic-state-title">Identity Verified</p>
                <p className="ic-state-text mb-6">
                  You answered all {progress.total} identity questions. Mission recommendations will adapt to your
                  profile.
                </p>
                <div className="ic-nav justify-center">
                  <a href="/explorer-dna" className="ic-btn-primary">
                    View Explorer DNA
                  </a>
                  <a href="/" className="ic-btn-secondary">
                    Back to Arena
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {loadState === "ready" && current && !isComplete && (
            <div className="ic-grid ic-grid-main">
              {progress.total > 0 && (
                <motion.aside
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.45 }}
                  className="ic-card"
                >
                  <div className="ic-card-body">
                    <p className="ic-label mb-3">Your Progress</p>
                    <p className="ic-progress-value mb-1">
                      {progress.answered}
                      <span className="text-purple-400/40 text-xl md:text-2xl font-bold"> / {progress.total}</span>
                    </p>
                    <p className="text-sm text-purple-300/55 mb-5 font-mono">{pct}% Identity Mapped</p>
                    <div className="ic-progress-track mb-3">
                      <motion.div
                        className="ic-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-purple-400/45">
                      {Math.max(progress.total - progress.answered, 0)} remaining
                    </p>
                  </div>
                </motion.aside>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="ic-grid gap-4 md:gap-5"
              >
                <div className="ic-card ic-card-gold">
                  <div className="ic-card-body">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                      <span className="rounded-lg border border-purple-500/30 bg-purple-950/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-200">
                        Question {progress.answered + 1} of {progress.total}
                      </span>
                    </div>

                    {rewardToast && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="ic-toast mb-4">
                        {rewardToast}
                      </motion.div>
                    )}

                    {errorMessage && <div className="ic-error mb-4">{errorMessage}</div>}

                    {answerBlock}

                    <div className="ic-nav">
                      <button
                        type="button"
                        className="ic-btn-primary"
                        disabled={!hasValidAnswer() || submitting}
                        onClick={() => void handleSubmit()}
                      >
                        {submitting ? "Saving…" : "Submit Answer"}
                      </button>
                      <a href="/" className="ic-btn-secondary">
                        Back to Arena
                      </a>
                    </div>
                  </div>
                </div>

                <div className="ic-card">
                  <div className="ic-card-body">
                    <p className="ic-label mb-3">Reward Preview</p>
                    <RewardChips q={current} />
                    <p className="text-sm text-purple-300/50 mt-4 leading-relaxed">
                      Rewards are granted once per question after verification rules pass.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id="identity-challenge" className="arena-section min-h-screen w-full">
      <div className="arena-section-inner w-full max-w-none px-4 py-10 md:px-8 lg:px-12 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="mb-8 md:mb-12 text-center lg:text-left">
            <p className="arena-subheading mb-3">Portal Verification · Mode 03</p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-4">
              Identity Challenge
            </h1>
            <p className="text-purple-300/55 text-sm md:text-base max-w-3xl mx-auto lg:mx-0">
              Answer identity questions from the portal database. Each verified answer unlocks rewards once per question.
            </p>
          </div>

          {loadState !== "loading" && loadState !== "unauthorized" && progress.total > 0 && (
            <GlowCard glow="violet" hover={false} className="w-full p-6 md:p-10 lg:p-12 mb-8 border border-violet-500/25">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-purple-400/50 font-bold mb-2">Progress</p>
                  <p className="text-2xl md:text-3xl font-black text-amber-300 tabular-nums">
                    {progress.answered} <span className="text-purple-400/40 text-lg">/ {progress.total}</span>
                  </p>
                </div>
                <p className="text-sm text-purple-300/60 font-mono">{pct}% Identity Mapped</p>
              </div>

              <div className="h-3 w-full rounded-full border border-purple-500/25 bg-black/50 overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-violet-600 via-purple-500 to-amber-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="text-[10px] uppercase tracking-wider text-purple-400/45">
                {Math.max(progress.total - progress.answered, 0)} question
                {progress.total - progress.answered === 1 ? "" : "s"} remaining
              </p>
            </GlowCard>
          )}

          {loadState === "loading" && (
            <GlowCard glow="purple" hover={false} className="w-full p-12 text-center text-purple-400/60">
              Loading identity questions…
            </GlowCard>
          )}

          {loadState === "error" && (
            <GlowCard glow="gold" hover={false} className="w-full p-8 border border-red-400/25 bg-red-950/20">
              <p className="text-red-300 font-semibold mb-2">{errorMessage || "Unable to load identity questions."}</p>
              <ArenaButton variant="gold" size="md" onClick={() => void loadQuestions()}>
                Retry
              </ArenaButton>
            </GlowCard>
          )}

          {loadState === "empty" && (
            <GlowCard glow="purple" hover={false} className="w-full p-12 text-center">
              <span className="text-5xl block mb-4">🎭</span>
              <p className="text-purple-300/70 text-sm">No identity questions available yet.</p>
            </GlowCard>
          )}

          {loadState === "complete" && (
            <GlowCard glow="gold" hover={false} className="w-full p-10 md:p-12 text-center border border-amber-400/30">
              <span className="text-5xl block mb-3">👑</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Identity Verified</h2>
              <p className="text-purple-300/55 text-sm max-w-lg mx-auto">
                You answered all {progress.total} identity questions. Mission recommendations will adapt to your profile.
              </p>
            </GlowCard>
          )}

          {loadState === "ready" && current && !isComplete && (
            <GlowCard glow="gold" hover={false} className="w-full p-6 md:p-10 lg:p-12 border border-amber-400/20">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <span className="rounded-md border border-purple-500/25 bg-purple-950/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Question {progress.answered + 1} of {progress.total}
                </span>
                <span className="text-xs text-amber-300/90 font-semibold">{formatRewardPreview(current)}</span>
              </div>

              {rewardToast && (
                <motion.p
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-400 text-sm font-semibold mb-4"
                >
                  {rewardToast}
                </motion.p>
              )}

              {errorMessage && (
                <p className="text-red-300 text-sm mb-4 rounded-lg border border-red-400/20 bg-red-950/20 px-4 py-3">
                  {errorMessage}
                </p>
              )}

              {answerBlock}

              <ArenaButton
                variant="gold"
                size="md"
                disabled={!hasValidAnswer() || submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Saving…" : "Submit Answer"}
              </ArenaButton>
            </GlowCard>
          )}
        </motion.div>
      </div>
    </section>
  );
}
