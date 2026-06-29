import { Router, Response } from "express";
import { getPublicCounters } from "../services/counterService";

const router = Router();

/** GET /api/counters — public live counter values */
router.get("/", async (_req, res: Response) => {
  try {
    const data = await getPublicCounters();
    res.json({ success: true, data });
  } catch {
    res.json({
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
    });
  }
});

export default router;
