"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { apiFetch } from "@/lib/api/client";
import type { VideoSubmission, VideoSubmissionStats } from "@/types/video-submission";
import {
  PLATFORM_ICONS,
  STATUS_LABELS,
  detectPlatformFromUrl,
  formatViews,
  parseViewsInput,
} from "@/lib/video-hunter/platform";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "ready" | "error";

interface ApiPayload {
  submissions: VideoSubmission[];
  stats: VideoSubmissionStats;
}

function StatusBadge({ status }: { status: VideoSubmission["status"] }) {
  const styles = {
    approved: "border-emerald-400/40 bg-emerald-950/40 text-emerald-300",
    rewarded: "border-amber-400/40 bg-amber-950/40 text-amber-300",
    pending: "border-violet-400/40 bg-violet-950/40 text-violet-300",
    rejected: "border-red-400/40 bg-red-950/40 text-red-300",
  };
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", styles[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function VideoCard({ video }: { video: VideoSubmission }) {
  return (
    <GlowCard glow={video.status === "approved" || video.status === "rewarded" ? "gold" : "purple"} className="p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-purple-500/25 bg-black/50 text-xl shrink-0">
            {PLATFORM_ICONS[video.platform]}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-white truncate">{video.ideaTitle}</p>
            <p className="text-[10px] uppercase tracking-wider text-purple-400/50">{video.platform}</p>
          </div>
        </div>
        <StatusBadge status={video.status} />
      </div>

      <p className="text-xs font-mono text-violet-200/70 truncate rounded-lg border border-purple-500/10 bg-black/40 px-3 py-2 mb-3">
        {video.videoUrl}
      </p>

      <p className="text-sm text-purple-200/80 leading-relaxed mb-4 line-clamp-3">{video.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
        <Metric label="Views" value={formatViews(video.visibleViews)} />
        <Metric label="XP" value={video.rewardXp > 0 ? `+${video.rewardXp}` : "—"} highlight={video.rewardXp > 0} />
        <Metric label="Gold" value={video.goldCoins > 0 ? `+${video.goldCoins}` : "—"} highlight={video.goldCoins > 0} />
        <Metric label="Submitted" value={new Date(video.submittedAt).toLocaleDateString()} />
      </div>

      {video.adminResponse && (
        <p className="text-xs text-purple-300/60 border-t border-purple-500/10 pt-3">
          <span className="text-[9px] uppercase tracking-wider text-purple-400/45 block mb-1">Admin</span>
          {video.adminResponse}
        </p>
      )}
    </GlowCard>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", highlight ? "border-amber-400/20 bg-amber-950/20" : "border-purple-500/10 bg-black/30")}>
      <span className="text-[9px] uppercase tracking-wider text-purple-400/50 block">{label}</span>
      <p className={cn("font-semibold tabular-nums", highlight ? "text-amber-300" : "text-white")}>{value}</p>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <GlowCard hover={false} className="p-5 text-center">
      <span className="text-2xl block mb-2">{icon}</span>
      <p className="text-2xl md:text-3xl font-black text-white tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.25em] text-purple-400/50 mt-1">{label}</p>
    </GlowCard>
  );
}

function VideoSection({
  title,
  subtitle,
  items,
  empty,
}: {
  title: string;
  subtitle: string;
  items: VideoSubmission[];
  empty: string;
}) {
  return (
    <section className="mb-12 md:mb-16">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-black text-white">{title}</h2>
        <p className="text-sm text-purple-300/55 mt-1">{subtitle}</p>
      </div>
      {items.length === 0 ? (
        <GlowCard hover={false} className="p-10 text-center text-purple-400/50 text-sm">
          {empty}
        </GlowCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((video, i) => (
            <motion.div key={video.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <VideoCard video={video} />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

export function VideoHunterPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState<VideoSubmission[]>([]);
  const [stats, setStats] = useState<VideoSubmissionStats | null>(null);
  const [toast, setToast] = useState("");

  const [url, setUrl] = useState("");
  const [views, setViews] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [description, setDescription] = useState("");
  const [manualPlatform, setManualPlatform] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const detected = url.trim() ? detectPlatformFromUrl(url) : null;
  const platform = detected ?? (manualPlatform || null);

  const load = useCallback(async () => {
    setLoadState("loading");
    setError("");
    const res = await apiFetch<ApiPayload>("/api/video-submissions");
    if (res.success && res.data) {
      setSubmissions(res.data.submissions);
      setStats(res.data.stats);
      setLoadState("ready");
      return;
    }
    setError(res.error ?? "Failed to load videos");
    setLoadState("error");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approved = useMemo(
    () => submissions.filter((s) => s.status === "approved" || s.status === "rewarded"),
    [submissions]
  );
  const pending = useMemo(() => submissions.filter((s) => s.status === "pending"), [submissions]);
  const rejected = useMemo(() => submissions.filter((s) => s.status === "rejected"), [submissions]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!platform || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    const res = await apiFetch<ApiPayload & { submission: VideoSubmission }>("/api/video-submissions", {
      method: "POST",
      body: JSON.stringify({
        videoUrl: url.trim(),
        platform,
        visibleViews: parseViewsInput(views),
        ideaTitle: ideaTitle.trim(),
        description: description.trim(),
      }),
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setSubmissions(res.data.submissions);
      setStats(res.data.stats);
      setUrl("");
      setViews("");
      setIdeaTitle("");
      setDescription("");
      setManualPlatform("");
      setToast("Video submitted — saved to your database.");
      setTimeout(() => setToast(""), 4000);
      return;
    }

    setSubmitError(res.error ?? "Failed to submit video");
  }

  return (
    <div className="w-full px-4 py-8 md:px-8 lg:px-12 xl:px-16">
      {/* Hero */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 md:mb-14 text-center max-w-4xl mx-auto"
      >
        <p className="arena-subheading mb-3">Video Hunter Command</p>
        <h1 className="arena-heading text-4xl md:text-5xl lg:text-6xl mb-4">Video Hunter</h1>
        <p className="text-purple-300/60 text-sm md:text-base leading-relaxed">
          Submit viral video links, track admin review, and earn XP plus coins when your ideas are approved.
        </p>
      </motion.header>

      {toast && (
        <p className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-300 text-center max-w-2xl mx-auto">
          {toast}
        </p>
      )}

      {loadState === "loading" && (
        <GlowCard hover={false} className="p-12 text-center text-purple-400/60 mb-10">
          <motion.div
            className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-purple-500/30 border-t-amber-400"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          Loading your video submissions from database…
        </GlowCard>
      )}

      {loadState === "error" && (
        <GlowCard glow="violet" hover={false} className="p-8 text-center mb-10 border-red-400/20">
          <p className="text-red-300 mb-4">{error}</p>
          <ArenaButton variant="gold" onClick={() => void load()}>
            Retry
          </ArenaButton>
        </GlowCard>
      )}

      <AnimatePresence>
        {loadState === "ready" && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 md:mb-14">
              <StatCard label="Total Videos" value={stats.total} icon="🎬" />
              <StatCard label="Approved" value={stats.approved} icon="✅" />
              <StatCard label="Pending" value={stats.pending} icon="⏳" />
              <StatCard label="Rejected" value={stats.rejected} icon="✕" />
            </div>

            <div className="grid xl:grid-cols-[1fr_380px] gap-8 items-start mb-12 md:mb-16">
              {/* Add New Video */}
              <GlowCard glow="gold" hover={false} className="p-6 md:p-8 border-amber-400/25">
                <p className="arena-subheading mb-2">Submit</p>
                <h2 className="text-2xl font-black text-white mb-6">Add New Video</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && <p className="text-sm text-red-400">{submitError}</p>}

                  <Field label="Video URL">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (detectPlatformFromUrl(e.target.value)) setManualPlatform("");
                      }}
                      placeholder="https://tiktok.com/@user/video/..."
                      className="vh-field"
                      required
                    />
                  </Field>

                  {detected && (
                    <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/25 px-4 py-3 flex items-center gap-3">
                      <span className="text-2xl">{PLATFORM_ICONS[detected]}</span>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-emerald-400/70">Platform auto-detected</p>
                        <p className="text-sm font-bold text-emerald-200">{detected}</p>
                      </div>
                    </div>
                  )}

                  {!detected && url.trim().length > 8 && (
                    <Field label="Select Platform">
                      <select
                        value={manualPlatform}
                        onChange={(e) => setManualPlatform(e.target.value)}
                        className="vh-field"
                        required
                      >
                        <option value="">Choose platform…</option>
                        {(["TikTok", "YouTube", "Instagram", "Facebook", "Snapchat", "X / Twitter"] as const).map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}

                  <Field label="Visible Views">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={views}
                      onChange={(e) => setViews(e.target.value)}
                      placeholder="e.g. 15,000"
                      className="vh-field"
                      required
                    />
                  </Field>

                  <Field label="Idea Title">
                    <input
                      type="text"
                      value={ideaTitle}
                      onChange={(e) => setIdeaTitle(e.target.value)}
                      placeholder="Short title for your video idea"
                      className="vh-field"
                      required
                    />
                  </Field>

                  <Field label="Description / Note">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Explain your video idea, hook, and why it can perform…"
                      rows={4}
                      className="vh-field resize-none min-h-[120px]"
                      required
                    />
                  </Field>

                  <ArenaButton
                    type="submit"
                    variant="gold"
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={!platform || submitting}
                  >
                    {submitting ? "Submitting…" : "Submit Video"}
                  </ArenaButton>
                </form>
              </GlowCard>

              {/* Rewards summary */}
              <GlowCard glow="violet" hover={false} className="p-6 md:p-8 xl:sticky xl:top-24">
                <p className="arena-subheading mb-2">Rewards</p>
                <h2 className="text-xl font-black text-white mb-6">Your Earnings</h2>
                <div className="space-y-4">
                  <RewardRow icon="✨" label="Total XP" value={stats.totalXp.toLocaleString()} />
                  <RewardRow icon="🥇" label="Gold Coins" value={stats.totalGold.toLocaleString()} />
                  <RewardRow icon="🥈" label="Silver Coins" value={stats.totalSilver.toLocaleString()} />
                  <RewardRow icon="🥉" label="Bronze Coins" value={stats.totalBronze.toLocaleString()} />
                </div>
                <p className="text-xs text-purple-400/50 mt-6 leading-relaxed border-t border-purple-500/10 pt-4">
                  Approved videos earn XP and coins after admin review. Minimum 10K views required for most payouts.
                </p>
              </GlowCard>
            </div>

            <VideoSection
              title="All Videos"
              subtitle="Every submission loaded from your database profile."
              items={submissions}
              empty="No videos yet — submit your first link above."
            />
            <VideoSection
              title="Approved Videos"
              subtitle="Verified submissions with rewards credited."
              items={approved}
              empty="No approved videos yet."
            />
            <VideoSection
              title="Pending Videos"
              subtitle="Awaiting admin review."
              items={pending}
              empty="No pending submissions."
            />
            <VideoSection
              title="Rejected Videos"
              subtitle="Did not meet requirements — check admin notes."
              items={rejected}
              empty="No rejected submissions."
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.2em] text-purple-400/55 font-bold mb-2">{label}</label>
      {children}
    </div>
  );
}

function RewardRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-purple-500/15 bg-black/40 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-purple-200">
        <span>{icon}</span>
        {label}
      </span>
      <span className="font-black text-amber-300 tabular-nums">{value}</span>
    </div>
  );
}
