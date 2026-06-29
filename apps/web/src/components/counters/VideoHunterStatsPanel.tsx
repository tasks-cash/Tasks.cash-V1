"use client";

import { LiveStatCard } from "@/components/counters/LiveStatCard";

export function VideoHunterStatsPanel() {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-black text-white mb-4">Video Hunter — Live Stats</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <LiveStatCard counterKey="videos_submitted" label="Videos Submitted" icon="🎥" glow="violet" />
        <LiveStatCard counterKey="approved_videos" label="Approved Videos" icon="✅" glow="gold" />
        <LiveStatCard counterKey="pending_videos" label="Pending Videos" icon="⏳" glow="purple" />
        <LiveStatCard counterKey="total_views_submitted" label="Total Views Submitted" icon="👁️" glow="gold" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <LiveStatCard counterKey="youtube_links_submitted" label="YouTube Links" icon="▶️" glow="violet" />
        <LiveStatCard counterKey="tiktok_links_submitted" label="TikTok Links" icon="🎵" glow="purple" />
        <LiveStatCard counterKey="instagram_links_submitted" label="Instagram Links" icon="📸" glow="gold" />
        <LiveStatCard counterKey="facebook_links_submitted" label="Facebook Links" icon="📘" glow="violet" />
        <LiveStatCard counterKey="snapchat_links_submitted" label="Snapchat Links" icon="👻" glow="purple" />
      </div>
    </section>
  );
}
