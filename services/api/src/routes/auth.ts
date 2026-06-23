import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, IUserDocument } from "../models/User";
import { Referral } from "../models/Referral";
import { Transaction } from "../models/Transaction";
import { authMiddleware, signToken, AuthRequest } from "../middleware/auth";
import { generateReferralCode } from "@tasks-cash/utils";
import { getOrCreateUserSettings } from "../services/notificationService";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/** POST /api/auth/register */
router.post("/register", async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });
    if (existing) {
      res.status(409).json({ success: false, error: "User already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const referralCode = generateReferralCode(data.username);

    const user = await User.create({
      username: data.username,
      email: data.email,
      passwordHash,
      referralCode,
    });

    // Handle referral bonus
    if (data.referralCode) {
      const referrer = await User.findOne({ referralCode: data.referralCode.toUpperCase() });
      if (referrer && referrer._id.toString() !== user._id.toString()) {
        const bonus = Number(process.env.REFERRAL_BONUS_COINS ?? 50);
        user.referredBy = referrer._id;
        referrer.coins += bonus;
        await referrer.save();
        await Referral.create({
          referrerId: referrer._id,
          referredUserId: user._id,
          bonusCoins: bonus,
        });
        await Transaction.create({
          userId: referrer._id,
          type: "referral_bonus",
          amount: bonus,
          description: `Referral bonus for ${user.username}`,
        });
      }
    }

    await user.save();
    await getOrCreateUserSettings(user._id.toString());
    const token = signToken(user._id.toString(), user.role);

    res.status(201).json({
      success: true,
      data: {
        accessToken: token,
        user: sanitizeUser(user),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

/** POST /api/auth/login */
router.post("/login", async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const token = signToken(user._id.toString(), user.role);
    res.json({
      success: true,
      data: { accessToken: token, user: sanitizeUser(user) },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

/** GET /api/auth/me */
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: sanitizeUser(req.user!) });
});

function sanitizeUser(user: IUserDocument) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    coins: user.coins,
    xp: user.xp,
    level: user.level,
    referralCode: user.referralCode,
    avatar: user.avatar,
    badges: user.badges,
    completedMissions: user.completedMissions,
    currencies: user.currencies,
    rpgStats: user.rpgStats,
    achievements: user.achievements,
    collectedBadges: user.collectedBadges,
    playerTitle: user.playerTitle,
    avatarFrame: user.avatarFrame,
    explorerRank: user.explorerRank,
    streakDays: user.streakDays,
    createdAt: user.createdAt,
  };
}

export default router;
