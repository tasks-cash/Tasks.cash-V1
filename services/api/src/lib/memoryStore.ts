import bcrypt from "bcryptjs";
import type {
  IReferralRecord,
  IReferralMeResponse,
  IVideoSubmission,
  ReferralStatus,
  VideoSubmissionStatus,
} from "@tasks-cash/types";
import { generateReferralCode, defaultCurrencies, defaultRPGStats } from "@tasks-cash/utils";
import type { IUserDocument } from "../models/User";

type MemoryUser = {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin" | "moderator";
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  coins: number;
  xp: number;
  level: number;
  createdAt: string;
};

let idCounter = 1000;
const nextId = () => `mem_${++idCounter}`;

const users = new Map<string, MemoryUser>();
const usersByEmail = new Map<string, MemoryUser>();
const usersByReferralCode = new Map<string, MemoryUser>();
const referrals = new Map<string, IReferralRecord>();
const videoSubmissions = new Map<string, IVideoSubmission>();

function seedMemoryStore() {
  if (users.size > 0) return;

  const inviter: MemoryUser = {
    id: "mem_inviter",
    username: "VoidHunter",
    email: "inviter@tasks.cash",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "user",
    referralCode: "VOID-7X9K",
    referralCount: 2,
    coins: 2500,
    xp: 6500,
    level: 12,
    createdAt: "2026-03-01T00:00:00.000Z",
  };

  users.set(inviter.id, inviter);
  usersByEmail.set(inviter.email, inviter);
  usersByReferralCode.set(inviter.referralCode, inviter);

  referrals.set("mem_ref_1", {
    id: "mem_ref_1",
    referrerId: inviter.id,
    referredUserId: "mem_user_1",
    referralCode: inviter.referralCode,
    status: "active",
    rewardXp: 100,
    rewardCoins: 500,
    adminNote: "Verified active explorer",
    createdAt: "2026-05-10T00:00:00.000Z",
    activatedAt: "2026-05-12T00:00:00.000Z",
    referredUser: { id: "mem_user_1", username: "SarahK", createdAt: "2026-05-10T00:00:00.000Z" },
  });

  referrals.set("mem_ref_2", {
    id: "mem_ref_2",
    referrerId: inviter.id,
    referredUserId: "mem_user_2",
    referralCode: inviter.referralCode,
    status: "pending",
    rewardXp: 0,
    rewardCoins: 0,
    createdAt: "2026-06-15T00:00:00.000Z",
    referredUser: { id: "mem_user_2", username: "AhmedR", createdAt: "2026-06-15T00:00:00.000Z" },
  });
}

seedMemoryStore();

function appBaseUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

export function buildReferralLink(code: string) {
  return `${appBaseUrl()}/register?ref=${encodeURIComponent(code)}`;
}

function serializeUser(user: MemoryUser) {
  return {
    _id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    coins: user.coins,
    xp: user.xp,
    level: user.level,
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    createdAt: user.createdAt,
  };
}

function asAuthUser(user: MemoryUser): IUserDocument {
  return {
    _id: user.id as unknown as IUserDocument["_id"],
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    role: user.role,
    coins: user.coins,
    xp: user.xp,
    level: user.level,
    referralCode: user.referralCode,
    referredBy: user.referredBy as unknown as IUserDocument["referredBy"],
    badges: [],
    completedMissions: [],
    currencies: defaultCurrencies(),
    rpgStats: defaultRPGStats(),
    achievements: [],
    collectedBadges: [],
    playerTitle: "Explorer",
    avatarFrame: "default",
    explorerRank: "Explorer I",
    streakDays: 0,
    treasuresOpened: 0,
    playTimeMinutes: 0,
    totalXpEarned: user.xp,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.createdAt),
  } as unknown as IUserDocument;
}

export const memoryStore = {
  findUserByEmail(email: string) {
    return usersByEmail.get(email.toLowerCase()) ?? null;
  },

  findUserByUsername(username: string) {
    return [...users.values()].find((u) => u.username.toLowerCase() === username.toLowerCase()) ?? null;
  },

  findUserById(id: string) {
    return users.get(id) ?? null;
  },

  findUserByReferralCode(code: string) {
    return usersByReferralCode.get(code.trim().toUpperCase()) ?? null;
  },

  createUser(input: { username: string; email: string; password: string; referralCode?: string }) {
    if (this.findUserByEmail(input.email) || this.findUserByUsername(input.username)) {
      return { error: "User already exists" as const };
    }

    const referralCode = generateReferralCode(input.username).toUpperCase();
    if (input.referralCode?.trim().toUpperCase() === referralCode) {
      return { error: "You cannot use your own referral code" as const };
    }

    let referrer: MemoryUser | null = null;
    if (input.referralCode?.trim()) {
      referrer = this.findUserByReferralCode(input.referralCode);
      if (!referrer) return { error: "Invalid referral code" as const };
    }

    const user: MemoryUser = {
      id: nextId(),
      username: input.username,
      email: input.email.toLowerCase(),
      passwordHash: bcrypt.hashSync(input.password, 10),
      role: "user",
      referralCode,
      referredBy: referrer?.id,
      referralCount: 0,
      coins: 100,
      xp: 0,
      level: 1,
      createdAt: new Date().toISOString(),
    };

    users.set(user.id, user);
    usersByEmail.set(user.email, user);
    usersByReferralCode.set(user.referralCode, user);

    if (referrer) {
      const bonus = Number(process.env.REFERRAL_BONUS_COINS ?? 50);
      referrer.coins += bonus;
      referrer.referralCount += 1;
      users.set(referrer.id, referrer);

      const record: IReferralRecord = {
        id: nextId(),
        referrerId: referrer.id,
        referredUserId: user.id,
        referralCode: referrer.referralCode,
        status: "pending",
        rewardXp: 100,
        rewardCoins: bonus,
        createdAt: user.createdAt,
        referredUser: { id: user.id, username: user.username, createdAt: user.createdAt },
      };
      referrals.set(record.id, record);
    }

    return { user: serializeUser(user) };
  },

  verifyLogin(email: string, password: string) {
    const user = this.findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) return null;
    return serializeUser(user);
  },

  validateReferralCode(code: string, selfReferralCode?: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return { valid: false, error: "Referral code is required" };
    if (selfReferralCode && normalized === selfReferralCode.toUpperCase()) {
      return { valid: false, error: "You cannot use your own referral code" };
    }
    const referrer = this.findUserByReferralCode(normalized);
    if (!referrer) return { valid: false, error: "Invalid referral code" };
    return { valid: true, code: normalized, referrerUsername: referrer.username };
  },

  getReferralMe(userId: string): IReferralMeResponse | null {
    const user = this.findUserById(userId);
    if (!user) return null;

    const history = [...referrals.values()]
      .filter((r) => r.referrerId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const activeReferrals = history.filter((r) => r.status === "active" || r.status === "rewarded").length;
    const pendingRewards = history
      .filter((r) => r.status === "pending" || r.status === "active")
      .reduce((sum, r) => sum + r.rewardCoins, 0);
    const earnedRewards = history
      .filter((r) => r.status === "rewarded")
      .reduce((sum, r) => sum + r.rewardCoins, 0);

    return {
      referralCode: user.referralCode,
      referralLink: buildReferralLink(user.referralCode),
      totalInvites: history.length,
      activeReferrals,
      pendingRewards,
      earnedRewards,
      history,
    };
  },

  getReferralHistory(userId: string) {
    return this.getReferralMe(userId)?.history ?? [];
  },

  listAdminReferrals() {
    return [...referrals.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  updateReferralStatus(id: string, status: ReferralStatus, adminNote?: string) {
    const record = referrals.get(id);
    if (!record) return null;
    const updated: IReferralRecord = {
      ...record,
      status,
      adminNote: adminNote ?? record.adminNote,
      activatedAt: status === "active" ? new Date().toISOString() : record.activatedAt,
      rewardedAt: status === "rewarded" ? new Date().toISOString() : record.rewardedAt,
    };
    referrals.set(id, updated);
    return updated;
  },

  listVideoSubmissions(userId?: string) {
    const items = [...videoSubmissions.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
    return userId ? items.filter((v) => v.userId === userId) : items;
  },

  getVideoSubmission(id: string) {
    return videoSubmissions.get(id) ?? null;
  },

  createVideoSubmission(input: {
    userId: string;
    videoUrl: string;
    platform: IVideoSubmission["platform"];
    visibleViews?: number;
    screenshotProofUrl?: string;
    description?: string;
  }) {
    const submission: IVideoSubmission = {
      id: nextId(),
      userId: input.userId,
      videoUrl: input.videoUrl,
      platform: input.platform,
      visibleViews: input.visibleViews ?? 0,
      screenshotProofUrl: input.screenshotProofUrl,
      description: input.description,
      status: "pending",
      rewardXp: 0,
      bronzeCoins: 0,
      silverCoins: 0,
      goldCoins: 0,
      diamondGems: 0,
      submittedAt: new Date().toISOString(),
    };
    videoSubmissions.set(submission.id, submission);
    return submission;
  },

  reviewVideoSubmission(
    id: string,
    status: Extract<VideoSubmissionStatus, "approved" | "rejected" | "rewarded">,
    payload: Partial<IVideoSubmission> & { reviewedBy?: string; adminResponse?: string }
  ) {
    const current = videoSubmissions.get(id);
    if (!current) return null;
    const updated: IVideoSubmission = {
      ...current,
      ...payload,
      status,
      reviewedAt: new Date().toISOString(),
    };
    videoSubmissions.set(id, updated);
    return updated;
  },

  asAuthUser,
};
