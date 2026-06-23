import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { getWalletSummary } from "../services/walletService";

const router = Router();

/** GET /api/wallet — balance + transaction history */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const { transactions, totalEarned, totalSpent } = await getWalletSummary(
    req.user!._id.toString()
  );

  res.json({
    success: true,
    data: {
      balance: req.user!.coins,
      totalEarned,
      totalSpent,
      transactions,
    },
  });
});

export default router;
