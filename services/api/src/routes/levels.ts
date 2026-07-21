import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (_req, res) => {
  res.json({ success: true, data: [], message: "levels endpoint ready" });
});

router.post("/", authenticate, requireAdmin, async (_req, res) => {
  res.json({ success: true, message: "levels created" });
});

export default router;
