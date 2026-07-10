import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, IUserDocument } from "../models/User";
import { Admin, IAdminDocument } from "../models/Admin";
import { Transaction } from "../models/Transaction";
import { authMiddleware, signToken, AuthRequest } from "../middleware/auth";
import { generateReferralCode, defaultCurrencies, getSafeRPGStats } from "@tasks-cash/utils";
import { getOrCreateUserSettings } from "../services/notificationService";
import { createReferralOnRegister } from "../services/referralService";
import { requireDbConnection } from "../lib/requireDb";
import { isAdminPortalRole, resolveStoredPasswordHash } from "../lib/passwordHash";

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

function isAdminLoginDebug(req: { headers: Record<string, unknown> }): boolean {
  return req.headers["x-tc-admin-login-debug"] === "1";
}

/** POST /api/auth/register — normal users only */
router.post("/register", async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    if (!requireDbConnection(res)) return;

    const existing = await User.findOne({
      $or: [{ email: data.email.toLowerCase() }, { username: data.username }],
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
      email: data.email.toLowerCase(),
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
    const token = signToken(user._id.toString(), user.role, user.email, "user");

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

/** POST /api/auth/login — normal users only (User collection) */
router.post("/login", async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    if (!requireDbConnection(res)) return;

    const email = data.email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const storedHash = resolveStoredPasswordHash(user);
    if (!storedHash || !(await bcrypt.compare(data.password, storedHash))) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    if (user.status && user.status !== "active") {
      res.status(403).json({ success: false, error: "Account is not active" });
      return;
    }

    if (isAdminPortalRole(user.role)) {
      res.status(403).json({ success: false, error: "Please use the admin portal to sign in" });
      return;
    }

    const token = signToken(user._id.toString(), user.role, user.email, "user");
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

/** POST /api/auth/admin/login — admin portal only (Admin collection) */
router.post("/admin/login", async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    if (!requireDbConnection(res)) return;

    const email = data.email.toLowerCase().trim();
    const admin = await Admin.findOne({ email });
    const storedHash = admin ? resolveStoredPasswordHash(admin) : null;
    const userFound = Boolean(admin);
    const passwordFieldExists = Boolean(storedHash);
    let passwordValid = false;

    if (admin && storedHash) {
      passwordValid = await bcrypt.compare(data.password, storedHash);
    }

    const roleAllowed = Boolean(admin && passwordValid && isAdminPortalRole(admin.role));
    const debugRequested = isAdminLoginDebug(req);

    if (debugRequested) {
      console.log("[AdminLogin:debug]", email, { userFound, passwordFieldExists, passwordValid, roleAllowed });
    }

    if (!admin || !passwordFieldExists || !passwordValid) {
      const body: Record<string, unknown> = { success: false, error: "Invalid credentials" };
      if (debugRequested) {
        body.debug = { userFound, passwordFieldExists, passwordValid, roleAllowed };
      }
      res.status(401).json(body);
      return;
    }

    if (!roleAllowed) {
      const body: Record<string, unknown> = { success: false, error: "Admin access denied" };
      if (debugRequested) {
        body.debug = { userFound, passwordFieldExists, passwordValid, roleAllowed };
      }
      res.status(403).json(body);
      return;
    }

    if (admin.status !== "active") {
      res.status(403).json({ success: false, error: "Account is not active" });
      return;
    }

    const token = signToken(admin._id.toString(), admin.role, admin.email, "admin");
    const response: Record<string, unknown> = {
      success: true,
      data: { accessToken: token, admin: sanitizeAdmin(admin) },
    };
    if (debugRequested) {
      response.debug = { userFound, passwordFieldExists, passwordValid, roleAllowed };
    }
    res.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: err.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

/** GET /api/auth/me — normal user session */
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (req.accountType !== "user" || !req.user) {
    res.status(403).json({ success: false, error: "User session required" });
    return;
  }
  res.json({ success: true, data: sanitizeUser(req.user) });
});

/** GET /api/auth/admin/me — admin session */
router.get("/admin/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  if (req.accountType !== "admin" || !req.admin) {
    res.status(403).json({ success: false, error: "Admin session required" });
    return;
  }
  res.json({ success: true, data: sanitizeAdmin(req.admin) });
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
    accountType: "user" as const,
    coins: user.coins,
    xp: user.xp,
    level: user.level,
    referralCode: user.referralCode,
    avatar: user.avatar,
    badges: user.badges ?? [],
    completedMissions: user.completedMissions ?? [],
    currencies: user.currencies ?? defaultCurrencies(),
    rpgStats: getSafeRPGStats(user.rpgStats),
    achievements: user.achievements ?? [],
    collectedBadges: user.collectedBadges ?? [],
    playerTitle: user.playerTitle,
    avatarFrame: user.avatarFrame,
    explorerRank: user.explorerRank,
    streakDays: user.streakDays ?? 0,
    createdAt: user.createdAt,
  };
}

function sanitizeAdmin(admin: IAdminDocument) {
  return {
    _id: admin._id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    accountType: "admin" as const,
    status: admin.status,
    createdAt: admin.createdAt,
  };
}

export default router;
