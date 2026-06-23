import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
  getGameDashboard,
  buildPlayerProfile,
  claimLiveReward,
  claimDailyReward,
  openTreasureChest,
  exchangeCurrency,
  getAchievementCatalog,
  getBadgeCatalog,
  getTreasureCatalog,
  getEventCatalog,
  onFirstLogin,
} from "../services/gameService";
import type { CurrencyType } from "@tasks-cash/types";

const router = Router();

/** GET /api/game/dashboard — full RPG dashboard */
router.get("/dashboard", authMiddleware, async (req: AuthRequest, res: Response) => {
  const data = await getGameDashboard(req.user!);
  res.json({ success: true, data });
});

/** GET /api/game/profile */
router.get("/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  await onFirstLogin(req.user!);
  const data = await buildPlayerProfile(req.user!);
  res.json({ success: true, data });
});

/** POST /api/game/live-reward — random reward while browsing */
router.post("/live-reward", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reward, profile } = await claimLiveReward(req.user!);
    res.json({ success: true, data: { reward, profile } });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** POST /api/game/daily-reward */
router.post("/daily-reward", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await claimDailyReward(req.user!);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** POST /api/game/treasure/open */
router.post("/treasure/open", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { chestId } = req.body as { chestId?: string };
    if (!chestId) {
      res.status(400).json({ success: false, error: "chestId required" });
      return;
    }
    const result = await openTreasureChest(req.user!, chestId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** POST /api/game/currency/exchange */
router.post("/currency/exchange", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { from, to, amount } = req.body as { from?: CurrencyType; to?: CurrencyType; amount?: number };
    if (!from || !to || !amount) {
      res.status(400).json({ success: false, error: "from, to, amount required" });
      return;
    }
    const profile = await exchangeCurrency(req.user!, from, to, amount);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, error: (err as Error).message });
  }
});

/** GET catalogs (public + authed) */
router.get("/achievements", (_req, res) => {
  res.json({ success: true, data: getAchievementCatalog() });
});

router.get("/badges", (_req, res) => {
  res.json({ success: true, data: getBadgeCatalog() });
});

router.get("/treasures", (_req, res) => {
  res.json({ success: true, data: getTreasureCatalog() });
});

router.get("/events", (_req, res) => {
  res.json({ success: true, data: getEventCatalog() });
});

export default router;
