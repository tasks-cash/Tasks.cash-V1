"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { apiFetch, apiFormFetch } from "@/lib/api/client";
import { getChallengeLoginUrl, hasAuthSession } from "@/lib/auth/client-session";
import { useLocale } from "@/i18n/I18nProvider";
import { withLocalePrefix } from "@/i18n/locale-path";
import type { SpecialMissionDetailPayload, SpecialMissionSubmission } from "@/types/special-mission";
import { cn } from "@/lib/utils";

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "border-emerald-400/35 text-emerald-300 bg-emerald-950/30",
  Medium: "border-yellow-400/35 text-yellow-300 bg-yellow-950/30",
  Hard: "border-orange-400/35 text-orange-300 bg-orange-950/30",
  Epic: "border-purple-400/35 text-purple-300 bg-purple-950/30",
  Legendary: "border-amber-400/45 text-amber-300 bg-amber-950/35",
};

const STATUS_STYLES: Record<string, string> = {
  open: "border-emerald-400/35 text-emerald-300 bg-emerald-950/25",
  in_progress: "border-sky-400/35 text-sky-300 bg-sky-950/25",
  closed: "border-red-400/35 text-red-300 bg-red-950/25",
  archived: "border-purple-400/25 text-purple-400/70 bg-purple-950/20",
};

const SUBMISSION_STYLES: Record<string, string> = {
  pending_review: "border-amber-400/35 text-amber-300 bg-amber-950/25",
  approved: "border-emerald-400/35 text-emerald-300 bg-emerald-950/25",
  rejected: "border-red-400/35 text-red-300 bg-red-950/25",
  rewarded: "border-amber-400/45 text-amber-200 bg-amber-950/35",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function SubmissionHistoryItem({ row }: { row: SpecialMissionSubmission }) {
  return (
    <div className="sm-history-item">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <span className="text-xs text-purple-400/55">{formatDate(row.submittedAt)}</span>
        <span
          className={cn(
            "sm-status-badge",
            SUBMISSION_STYLES[row.status] ?? SUBMISSION_STYLES.pending_review
          )}
        >
          {row.status.replace("_", " ")}
        </span>
      </div>
      {row.proofText && <p className="text-sm text-purple-100/90 mb-2 whitespace-pre-wrap">{row.proofText}</p>}
      {row.proofUrl && (
        <p className="text-xs text-violet-300/80 mb-2 break-all">
          URL:{" "}
          <a href={row.proofUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-300">
            {row.proofUrl}
          </a>
        </p>
      )}
      {row.proofFileUrl && (
        <p className="text-xs mb-2">
          <a href={row.proofFileUrl} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline">
            View uploaded proof file
          </a>
        </p>
      )}
      {row.userNote && (
        <p className="text-xs text-purple-300/60">
          <span className="uppercase tracking-wider text-[9px] text-purple-400/45">Note · </span>
          {row.userNote}
        </p>
      )}
      {row.adminNote && (
        <p className="text-xs text-purple-300/70 mt-2 border-t border-purple-500/10 pt-2">
          <span className="uppercase tracking-wider text-[9px] text-purple-400/45 block mb-1">Admin</span>
          {row.adminNote}
        </p>
      )}
    </div>
  );
}

function RewardChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="sm-reward-chip">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

export function SpecialMissionDetailPage({ missionId }: { missionId: string }) {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<SpecialMissionDetailPayload | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [userNote, setUserNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const loadMission = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await apiFetch<SpecialMissionDetailPayload>(`/api/special-missions/${missionId}`);
    if (!res.success || !res.data?.mission) {
      setError(res.error ?? "Mission not found");
      setPayload(null);
    } else {
      setPayload(res.data);
    }
    setLoading(false);
  }, [missionId]);

  useEffect(() => {
    void loadMission();
  }, [loadMission]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setSuccess("");

    const authed = await hasAuthSession();
    if (!authed) {
      window.location.href = getChallengeLoginUrl();
      return;
    }

    if (!proofText.trim() && !proofUrl.trim() && !proofFile) {
      setSubmitError("Provide proof text, a URL, or upload a file.");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    if (proofText.trim()) formData.append("proofText", proofText.trim());
    if (proofUrl.trim()) formData.append("proofUrl", proofUrl.trim());
    if (userNote.trim()) formData.append("userNote", userNote.trim());
    if (proofFile) formData.append("proofFile", proofFile);

    const res = await apiFormFetch<{ submission: SpecialMissionSubmission }>(
      `/api/special-missions/${missionId}/submit-proof`,
      formData
    );
    setSubmitting(false);

    if (res.success) {
      setSuccess("Proof submitted — status is pending review.");
      setProofText("");
      setProofUrl("");
      setUserNote("");
      setProofFile(null);
      void loadMission();
      return;
    }

    setSubmitError(res.error ?? "Failed to submit proof");
  }

  const mission = payload?.mission;
  const canSubmit = mission && mission.status !== "closed" && mission.status !== "archived";

  return (
    <div className="special-missions-page special-mission-detail">
      <div className="mb-6">
        <Link href={withLocalePrefix("/special-missions", locale)} className="sm-back-link">
          ← Back to Special Missions
        </Link>
      </div>

      {loading && (
        <div className="sm-state-card">
          <motion.div
            className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-purple-300/60">Loading mission from database…</p>
        </div>
      )}

      {error && !loading && (
        <div className="sm-state-card border-red-400/25">
          <p className="text-red-300 mb-4">{error}</p>
          <ArenaButton variant="gold" onClick={() => void loadMission()}>
            Retry
          </ArenaButton>
        </div>
      )}

      {mission && !loading && payload && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="sm-detail-layout">
          <header className="special-missions-hero sm-detail-hero">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4 relative z-10">
              <span className="text-[10px] uppercase tracking-[0.28em] text-purple-400/55 font-bold">
                {mission.category}
              </span>
              <div className="flex flex-wrap gap-2">
                <span className={cn("sm-status-badge", DIFFICULTY_STYLES[mission.difficulty])}>
                  {mission.difficulty}
                </span>
                <span className={cn("sm-status-badge", STATUS_STYLES[mission.status])}>
                  {mission.status.replace("_", " ")}
                </span>
              </div>
            </div>
            <h1 className="arena-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 relative z-10">
              {mission.title}
            </h1>
            <p className="text-purple-200/70 text-base md:text-lg leading-relaxed max-w-5xl relative z-10">
              {mission.description}
            </p>
          </header>

          <div className="sm-detail-meta-row">
            <div className="sm-detail-meta-chip">
              <span className="label">Deadline</span>
              <span className="value">{formatDate(mission.deadline)}</span>
            </div>
            <div className="sm-detail-meta-chip">
              <span className="label">Difficulty</span>
              <span className="value">{mission.difficulty}</span>
            </div>
            <div className="sm-detail-meta-chip">
              <span className="label">Status</span>
              <span className="value capitalize">{mission.status.replace("_", " ")}</span>
            </div>
            <div className="sm-detail-meta-chip">
              <span className="label">Your Proofs</span>
              <span className="value">{payload.submissions.length}</span>
            </div>
          </div>

          <div className="sm-detail-grid-top">
            <section className="sm-detail-panel">
              <h2 className="sm-detail-heading">Mission Info</h2>
              <p className="text-sm text-purple-100/85 leading-relaxed mb-6">{mission.description}</p>

              {mission.rules.length > 0 && (
                <>
                  <h2 className="sm-detail-heading">Rules</h2>
                  <ul className="space-y-2">
                    {mission.rules.map((rule) => (
                      <li key={rule} className="flex gap-2 text-sm text-purple-200/70">
                        <span className="text-amber-400 shrink-0">◆</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="sm-detail-panel">
              <h2 className="sm-detail-heading">Reward Panel</h2>
              <div className="grid grid-cols-2 gap-3">
                <RewardChip label="XP" value={`+${mission.rewardXp}`} />
                <RewardChip label="Bronze" value={`+${mission.bronzeCoins}`} />
                <RewardChip label="Silver" value={`+${mission.silverCoins}`} />
                <RewardChip label="Gold" value={`+${mission.goldCoins}`} />
              </div>
              <p className="text-xs text-purple-400/50 mt-4 leading-relaxed">
                Rewards are granted after admin review and approval of your submitted proof.
              </p>
            </section>
          </div>

          <div className="sm-detail-grid">
            <section className="sm-detail-panel">
              <h2 className="sm-detail-heading">Required Proof</h2>
              <p className="text-sm text-purple-100/85 leading-relaxed">{mission.requiredProof}</p>
            </section>

            <section className="sm-detail-panel">
              <h2 className="sm-detail-heading">Submit Proof</h2>
              {!canSubmit ? (
                <p className="text-sm text-red-300/80">This mission is no longer accepting proof.</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="sm-field-label" htmlFor="proof-text">
                      Proof / Description
                    </label>
                    <textarea
                      id="proof-text"
                      className="sm-proof-input"
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                      placeholder="Describe what you completed…"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="sm-field-label" htmlFor="proof-url">
                      Proof URL
                    </label>
                    <input
                      id="proof-url"
                      type="url"
                      className="sm-proof-input sm-proof-input-single"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                  <div>
                    <label className="sm-field-label" htmlFor="proof-file">
                      Proof File (optional)
                    </label>
                    <input
                      id="proof-file"
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                      className="sm-file-input"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div>
                    <label className="sm-field-label" htmlFor="user-note">
                      Your Note (optional)
                    </label>
                    <textarea
                      id="user-note"
                      className="sm-proof-input"
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      placeholder="Extra context for admin review…"
                      rows={2}
                    />
                  </div>
                  {submitError && <p className="text-sm text-red-400">{submitError}</p>}
                  {success && <p className="text-sm text-emerald-400">{success}</p>}
                  <ArenaButton type="submit" variant="gold" className="w-full" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit Proof"}
                  </ArenaButton>
                </form>
              )}

              {payload.submissions.length > 0 && (
                <div className="mt-10 border-t border-purple-500/15 pt-8">
                  <h2 className="sm-detail-heading">Submission History</h2>
                  <div className="space-y-3 mt-4">
                    {payload.submissions.map((row) => (
                      <SubmissionHistoryItem key={row.id} row={row} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </motion.div>
      )}
    </div>
  );
}
