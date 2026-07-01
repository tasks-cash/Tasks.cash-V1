import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { Reward } from "../models/Reward";
import { User } from "../models/User";
import { Transaction } from "../models/Transaction";
import { requireDbConnection } from "../lib/requireDb";

const router = Router();

/** GET /api/rewards — list available rewards */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  const rewards = await Reward.find({ isActive: true }).sort({ requiredLevel: 1 });
  const user = req.user!;

  res.json({
    success: true,
    data: rewards.map((r) => ({
      ...r.toObject(),
      unlocked: user.level >= r.requiredLevel && user.coins >= (r.requiredCoins ?? 0),
      owned: user.badges.includes(r.name),
    })),
  });
});

/** POST /api/rewards/:id/claim */
router.post("/:id/claim", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!requireDbConnection(res)) return;

  const reward = await Reward.findById(req.params.id);
  if (!reward || !reward.isActive) {
    res.status(404).json({ success: false, error: "Reward not found" });
    return;
  }

  const user = await User.findById(req.user!._id);
  if (!user) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  if (user.level < reward.requiredLevel) {
    res.status(403).json({ success: false, error: "Level requirement not met" });
    return;
  }

  if (reward.requiredCoins && user.coins < reward.requiredCoins) {
    res.status(403).json({ success: false, error: "Insufficient coins" });
    return;
  }

  if (user.badges.includes(reward.name)) {
    res.status(409).json({ success: false, error: "Reward already claimed" });
    return;
  }

  if (reward.requiredCoins) user.coins -= reward.requiredCoins;
  if (reward.type === "coins") user.coins += reward.value;
  if (reward.type === "xp") user.xp += reward.value;
  if (reward.type === "badge" || reward.type === "item") user.badges.push(reward.name);

  await user.save();
  await Transaction.create({
    userId: user._id,
    type: "purchase",
    amount: -(reward.requiredCoins ?? 0) + (reward.type === "coins" ? reward.value : 0),
    description: `Claimed reward: ${reward.name}`,
  });

  res.json({ success: true, data: { reward, user: { coins: user.coins, xp: user.xp, badges: user.badges } } });
});

export default router;
