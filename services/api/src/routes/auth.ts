import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isDbConnected } from "../config/database";
import { User, IUserDocument } from "../models/User";
import { Transaction } from "../models/Transaction";
import { authMiddleware, signToken, AuthRequest } from "../middleware/auth";
import { generateReferralCode } from "@tasks-cash/utils";
import { getOrCreateUserSettings } from "../services/notificationService";
import { createReferralOnRegister } from "../services/referralService";
import { requireDbConnection } from "../lib/requireDb";

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

    if (!requireDbConnection(res)) return;

    const existing = await User.findOne({
      $or: [{ email: data.email }, { username: data.username }],
    });
    if (existing) {
      res.status(409).json({ success: false, error: "User already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const generatedReferralCode = generateReferralCode(data.username).toUpperCase();

    if (data.referralCode?.trim().toUpperCase() === generatedReferralCode) {
      res.status(400).json({ success: false, error: "You cannot use your own referral code" });
      return;
    }

    let referrer: IUserDocument | null = null;
    if (data.referralCode?.trim()) {
      referrer = await User.findOne({ referralCode: data.referralCode.trim().toUpperCase() });
      if (!referrer) {
        res.status(400).json({ success: false, error: "Invalid referral code" });
        return;
      }
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      passwordHash,
      referralCode: generatedReferralCode,
      referredBy: referrer?._id,
    });

    if (referrer) {
      const bonus = Number(process.env.REFERRAL_BONUS_COINS ?? 50);
      referrer.coins += bonus;
      await referrer.save();
      await createReferralOnRegister(
        referrer._id.toString(),
        user._id.toString(),
        referrer.referralCode,
        bonus
      );
      await Transaction.create({
        userId: referrer._id,
        type: "referral_bonus",
        amount: bonus,
        description: `Referral bonus for ${user.username}`,
      });
    }

    await getOrCreateUserSettings(user._id.toString());
    const token = signToken(user._id.toString(), user.role, user.email);

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
    if ((err as { code?: number }).code === 11000) {
      res.status(409).json({ success: false, error: "Duplicate referral registration is not allowed" });
      return;
    }
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

/** POST /api/auth/login */
router.post("/login", async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    if (!requireDbConnection(res)) return;

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

    const token = signToken(user._id.toString(), user.role, user.email);
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

/** POST /api/auth/logout — stateless JWT logout acknowledgement */
router.post("/logout", async (_req, res: Response) => {
  res.json({ success: true, message: "Logged out" });
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
