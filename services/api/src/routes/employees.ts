import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (_req, res) => {
  res.json({ success: true, data: [], message: "employees endpoint ready" });
});

router.post("/", authenticate, requireAdmin, async (_req, res) => {
  res.json({ success: true, message: "employees created" });
});

export default router;
