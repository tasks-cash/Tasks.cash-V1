import { Router, Response } from "express";
import { z } from "zod";
import type { IVideoSubmission } from "@tasks-cash/types";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { VideoSubmission, IVideoSubmissionDocument } from "../models/VideoSubmission";
import { detectVideoPlatform } from "../lib/videoPlatform";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

const createSchema = z.object({
  videoUrl: z.string().url(),
  visibleViews: z.number().int().min(0).optional(),
  screenshotProofUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
});

function mapVideo(doc: IVideoSubmissionDocument): IVideoSubmission {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    videoUrl: doc.videoUrl,
    platform: doc.platform,
    visibleViews: doc.visibleViews,
    screenshotProofUrl: doc.screenshotProofUrl,
    description: doc.description,
    status: doc.status,
    rewardXp: doc.rewardXp,
    bronzeCoins: doc.bronzeCoins,
    silverCoins: doc.silverCoins,
    goldCoins: doc.goldCoins,
    diamondGems: doc.diamondGems,
    adminResponse: doc.adminResponse,
    submittedAt: doc.submittedAt.toISOString(),
    reviewedAt: doc.reviewedAt?.toISOString(),
    reviewedBy: doc.reviewedBy?.toString(),
  };
}

/** GET /api/video-submissions */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  const docs = await VideoSubmission.find({ userId: req.user!._id }).sort({ submittedAt: -1 });
  res.json({ success: true, data: docs.map(mapVideo) });
});

/** POST /api/video-submissions */
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  try {
    const data = createSchema.parse(req.body);
    const platform = detectVideoPlatform(data.videoUrl);

    const doc = await VideoSubmission.create({
      userId: req.user!._id,
      videoUrl: data.videoUrl,
      platform,
      visibleViews: data.visibleViews ?? 0,
      screenshotProofUrl: data.screenshotProofUrl,
      description: data.description,
    });

    res.status(201).json({ success: true, data: mapVideo(doc) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to submit video" });
  }
});

/** GET /api/video-submissions/:id */
router.get("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  const doc = await VideoSubmission.findOne({ _id: req.params.id, userId: req.user!._id });
  if (!doc) {
    res.status(404).json({ success: false, error: "Submission not found" });
    return;
  }
  res.json({ success: true, data: mapVideo(doc) });
});

export default router;
