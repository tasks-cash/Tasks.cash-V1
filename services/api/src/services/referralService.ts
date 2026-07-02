import type { IReferralMeResponse, IReferralRecord, ReferralStatus } from "@tasks-cash/types";
import { Referral, IReferralDocument } from "../models/Referral";
import { User } from "../models/User";
import { buildReferralLink } from "../lib/referralLink";

function mapReferralDoc(doc: IReferralDocument): IReferralRecord {
  const referred = doc.referredUserId as unknown as {
    _id?: { toString(): string };
    username?: string;
    createdAt?: Date;
  };

  const referredUserId =
    referred?._id?.toString?.() ??
    (typeof doc.referredUserId === "object" && doc.referredUserId !== null && "toString" in doc.referredUserId
      ? String(doc.referredUserId)
      : String(doc.referredUserId));

  return {
    id: doc._id.toString(),
    referrerId: doc.referrerId.toString(),
    referredUserId,
    referralCode: doc.referralCode,
    status: doc.status,
    rewardXp: doc.rewardXp,
    rewardCoins: doc.rewardCoins || doc.bonusCoins,
    adminNote: doc.adminNote,
    createdAt: doc.createdAt.toISOString(),
    activatedAt: doc.activatedAt?.toISOString(),
    rewardedAt: doc.rewardedAt?.toISOString(),
    referredUser: referred?.username
      ? {
          id: referred._id?.toString() ?? referredUserId,
          username: referred.username,
          createdAt: referred.createdAt?.toISOString() ?? doc.createdAt.toISOString(),
        }
      : undefined,
  };
}

export async function getReferralMe(userId: string, referralCode: string): Promise<IReferralMeResponse> {
  const referrals = await Referral.find({ referrerId: userId })
    .populate("referredUserId", "username createdAt")
    .sort({ createdAt: -1 });

  const history = referrals.map((doc) => mapReferralDoc(doc as IReferralDocument));
  const activeReferrals = history.filter((r) => r.status === "active" || r.status === "rewarded").length;
  const pendingRewards = history
    .filter((r) => r.status === "pending" || r.status === "active")
    .reduce((sum, r) => sum + r.rewardCoins, 0);
  const earnedRewards = history
    .filter((r) => r.status === "rewarded")
    .reduce((sum, r) => sum + r.rewardCoins, 0);

  return {
    referralCode,
    referralLink: buildReferralLink(referralCode),
    totalInvites: history.length,
    activeReferrals,
    pendingRewards,
    earnedRewards,
    history,
  };
}

export async function getReferralHistory(userId: string) {
  const me = await getReferralMe(userId, "");
  return me.history;
}

export interface ReferralLeaderboardChampion {
  rank: number;
  userId: string;
  username: string;
  referrals: number;
  rewardCoins: number;
}

export interface ReferralLeaderboardsResponse {
  daily: ReferralLeaderboardChampion[];
  weekly: ReferralLeaderboardChampion[];
  monthly: ReferralLeaderboardChampion[];
}

async function buildReferralLeaderboardSince(since: Date): Promise<ReferralLeaderboardChampion[]> {
  const rows = await Referral.aggregate<{ _id: import("mongoose").Types.ObjectId; referrals: number; rewardCoins: number }>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: "$referrerId",
        referrals: { $sum: 1 },
        rewardCoins: { $sum: "$rewardCoins" },
      },
    },
    { $sort: { referrals: -1 } },
    { $limit: 10 },
  ]);

  if (rows.length === 0) return [];

  const users = await User.find({ _id: { $in: rows.map((r) => r._id) } }).select("username");
  const names = new Map(users.map((u) => [u._id.toString(), u.username]));

  return rows.map((row, index) => ({
    rank: index + 1,
    userId: row._id.toString(),
    username: names.get(row._id.toString()) ?? "Explorer",
    referrals: row.referrals,
    rewardCoins: row.rewardCoins,
  }));
}

export async function getReferralLeaderboards(): Promise<ReferralLeaderboardsResponse> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const [daily, weekly, monthly] = await Promise.all([
    buildReferralLeaderboardSince(new Date(now - dayMs)),
    buildReferralLeaderboardSince(new Date(now - 7 * dayMs)),
    buildReferralLeaderboardSince(new Date(now - 30 * dayMs)),
  ]);
  return { daily, weekly, monthly };
}

export async function validateReferralCode(code: string, selfReferralCode?: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { valid: false, error: "Referral code is required" };
  if (selfReferralCode && normalized === selfReferralCode.toUpperCase()) {
    return { valid: false, error: "You cannot use your own referral code" };
  }

  const referrer = await User.findOne({ referralCode: normalized });
  if (!referrer) return { valid: false, error: "Invalid referral code" };
  return { valid: true, code: normalized, referrerUsername: referrer.username };
}

export async function listAdminReferrals() {
  const referrals = await Referral.find()
    .populate("referrerId", "username referralCode")
    .populate("referredUserId", "username createdAt")
    .sort({ createdAt: -1 });

  return referrals.map((doc) => mapReferralDoc(doc as IReferralDocument));
}

export async function updateReferralStatus(id: string, status: ReferralStatus, adminNote?: string) {
  const update: Partial<IReferralDocument> = { status, adminNote };
  if (status === "active") update.activatedAt = new Date();
  if (status === "rewarded") update.rewardedAt = new Date();

  const doc = await Referral.findByIdAndUpdate(id, update, { new: true }).populate(
    "referredUserId",
    "username createdAt"
  );
  return doc ? mapReferralDoc(doc as IReferralDocument) : null;
}

export async function createReferralOnRegister(
  referrerId: string,
  referredUserId: string,
  referralCode: string,
  bonusCoins: number
) {
  return Referral.create({
    referrerId,
    referredUserId,
    referralCode: referralCode.toUpperCase(),
    status: "pending",
    rewardXp: 100,
    rewardCoins: bonusCoins,
    bonusCoins,
  });
}
