import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import {
  getAdminCounters,
  launchCounters,
  stopCounters,
  updateCounter,
} from "../services/counterService";
import { invalidateByReason } from "../services/contentCacheInvalidation";

const router = Router();

router.use(authMiddleware, adminMiddleware);

/**
 * Future-safe: counters are live-polled and not embedded in page payloads today.
 * Statistics invalidation only affects pages explicitly tagged as statistics-dependent.
 */
async function invalidateStatisticsCaches(): Promise<void> {
  await Promise.all([
    invalidateByReason({ kind: "statistics", appKey: "main" }),
    invalidateByReason({ kind: "statistics", appKey: "challenge" }),
    invalidateByReason({ kind: "statistics", appKey: "admin" }),
  ]);
}

/** GET /api/admin/counters */
router.get("/", async (_req, res: Response) => {
  const data = await getAdminCounters();
  res.json({ success: true, data });
});

/** POST /api/admin/counters/launch */
router.post("/launch", async (_req, res: Response) => {
  const data = await launchCounters();
  await invalidateStatisticsCaches();
  res.json({ success: true, data, message: "Counters launched" });
});

/** POST /api/admin/counters/stop */
router.post("/stop", async (_req, res: Response) => {
  const data = await stopCounters();
  await invalidateStatisticsCaches();
  res.json({ success: true, data, message: "Counters stopped" });
});

/** PATCH /api/admin/counters/:key */
router.patch("/:key", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    value: z.number().min(0).optional(),
    incrementMin: z.number().min(0).optional(),
    incrementMax: z.number().min(0).optional(),
    intervalSeconds: z.number().min(1).optional(),
    isActive: z.boolean().optional(),
  });

  const patch = schema.parse(req.body);
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
  const updated = await updateCounter(key, patch);

  if (!updated) {
    res.status(404).json({ success: false, error: "Counter not found" });
    return;
  }

  await invalidateStatisticsCaches();
  const data = await getAdminCounters();
  res.json({ success: true, data, counter: updated });
});

export default router;
