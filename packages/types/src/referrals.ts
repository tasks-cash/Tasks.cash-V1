/** Referral invite system types */

export type ReferralStatus = "pending" | "active" | "rewarded" | "rejected";

export interface IReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  status: ReferralStatus;
  rewardXp: number;
  rewardCoins: number;
  adminNote?: string;
  createdAt: string;
  activatedAt?: string;
  rewardedAt?: string;
  /** Populated on history responses */
  referredUser?: {
    id: string;
    username: string;
    email?: string;
    createdAt: string;
  };
}

export interface IReferralMeStats {
  referralCode: string;
  referralLink: string;
  totalInvites: number;
  activeReferrals: number;
  pendingRewards: number;
  earnedRewards: number;
}

export interface IReferralMeResponse extends IReferralMeStats {
  history: IReferralRecord[];
}

export interface IReferralValidateResult {
  valid: boolean;
  code?: string;
  referrerUsername?: string;
  error?: string;
}
