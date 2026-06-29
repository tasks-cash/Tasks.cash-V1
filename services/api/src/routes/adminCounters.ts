import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, adminMiddleware, AuthRequest } from "../middleware/auth";
import {
  getAdminCounters,
  launchCounters,
  stopCounters,
  updateCounter,
} from "../services/counterService";

const router = Router();

router.use(authMiddleware, adminMiddleware);

/** GET /api/admin/counters */
router.get("/", async (_req, res: Response) => {
  const data = await getAdminCounters();
  res.json({ success: true, data });
});

/** POST /api/admin/counters/launch */
router.post("/launch", async (_req, res: Response) => {
  const data = await launchCounters();
  res.json({ success: true, data, message: "Counters launched" });
});

/** POST /api/admin/counters/stop */
router.post("/stop", async (_req, res: Response) => {
  const data = await stopCounters();
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

  const data = await getAdminCounters();
  res.json({ success: true, data, counter: updated });
});

export default router;
