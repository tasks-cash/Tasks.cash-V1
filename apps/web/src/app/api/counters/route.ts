import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/counters`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      {
        success: true,
        data: {
          isRunning: false,
          values: {
            total_users: 0,
            active_users: 0,
            registered_explorers: 0,
            videos_submitted: 0,
            approved_videos: 0,
            pending_videos: 0,
            total_views_submitted: 0,
            missions_completed: 0,
            rewards_distributed: 0,
            withdrawals_completed: 0,
            active_challenges: 0,
            youtube_links_submitted: 0,
            tiktok_links_submitted: 0,
            instagram_links_submitted: 0,
            facebook_links_submitted: 0,
            snapchat_links_submitted: 0,
          },
          updatedAt: new Date(0).toISOString(),
        },
      },
      { status: 200 }
    );
  }
}
