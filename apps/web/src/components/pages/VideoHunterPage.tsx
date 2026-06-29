"use client";

import { useEffect, useMemo, useState } from "react";
import type { IVideoSubmission } from "@tasks-cash/types";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { apiFetch } from "@/lib/api";
import { DEV_MOCK_VIDEO_SUBMISSIONS } from "@/lib/dev-mocks/video-submissions";
import { detectVideoPlatform, platformLabel, STATUS_LABELS } from "@/lib/referral-utils";

export function VideoHunterPage() {
  const [submissions, setSubmissions] = useState<IVideoSubmission[]>(DEV_MOCK_VIDEO_SUBMISSIONS);
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [visibleViews, setVisibleViews] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const detectedPlatform = useMemo(() => detectVideoPlatform(videoUrl), [videoUrl]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await apiFetch<IVideoSubmission[]>("/api/video-submissions");
      if (res.success && res.data) setSubmissions(res.data);
      setLoading(false);
    }
    load();
  }, [success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const res = await apiFetch<IVideoSubmission>("/api/video-submissions", {
      method: "POST",
      body: JSON.stringify({
        videoUrl,
        description: description || undefined,
        visibleViews: visibleViews ? Number(visibleViews) : undefined,
      }),
    });

    setSubmitting(false);

    if (!res.success || !res.data) {
      setError(res.error ?? "Failed to submit video");
      return;
    }

    setSubmissions((prev) => [res.data!, ...prev]);
    setVideoUrl("");
    setDescription("");
    setVisibleViews("");
    setSuccess("Video link submitted for review.");
  }

  return (
    <GameHubLayout
      breadcrumb="Hub · Video Hunter"
      eyebrow="Submit · Track · Earn"
      title="VIDEO HUNTER"
      subtitle="Submit public video links, track review status, and earn coins and XP after approval."
    >
      <div className="grid xl:grid-cols-[420px_1fr] gap-6 pb-12">
        <GlassCard glow="gold" className="p-6 h-fit">
          <h2 className="text-lg font-black text-white mb-4">Submit New Video Link</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                required
                className="mt-1"
                placeholder="https://www.tiktok.com/..."
              />
              <p className="text-xs text-purple-400/50 mt-2">
                Platform detected: <span className="text-amber-300">{platformLabel(detectedPlatform)}</span>
              </p>
            </div>
            <div>
              <Label htmlFor="visibleViews">Visible Views (optional)</Label>
              <Input
                id="visibleViews"
                type="number"
                min={0}
                value={visibleViews}
                onChange={(e) => setVisibleViews(e.target.value)}
                className="mt-1"
                placeholder="10000"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                placeholder="Challenge promo video"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-emerald-400 text-sm">{success}</p>}
            <PortalButton variant="gold" className="w-full" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Video Link"}
            </PortalButton>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-black text-white">Your Submissions</h2>
            {loading && <span className="text-xs text-purple-400/50">Loading...</span>}
          </div>

          <div className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-purple-400/50 text-sm">No submissions yet.</p>
            ) : (
              submissions.map((item) => {
                const status = STATUS_LABELS[item.status] ?? STATUS_LABELS.pending;
                return (
                  <div key={item.id} className="rounded-xl border border-purple-500/15 bg-black/30 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-white">{platformLabel(item.platform)}</p>
                        <a
                          href={item.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-violet-300 hover:text-amber-300 break-all"
                        >
                          {item.videoUrl}
                        </a>
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-purple-300/70 mb-3">
                      <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                      <span>Views: {item.visibleViews.toLocaleString()}</span>
                      <span>XP: {item.rewardXp}</span>
                      <span>
                        Coins: {item.bronzeCoins}🥉 {item.silverCoins}🥈 {item.goldCoins}🥇 {item.diamondGems}💎
                      </span>
                    </div>

                    {item.adminResponse && (
                      <p className="text-sm text-purple-200/80 border-t border-purple-500/10 pt-3">
                        Admin: {item.adminResponse}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>
      </div>
    </GameHubLayout>
  );
}
