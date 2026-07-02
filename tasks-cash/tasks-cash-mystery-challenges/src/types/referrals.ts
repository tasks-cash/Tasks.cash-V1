export type ReferralStatus = "pending" | "active" | "rewarded" | "rejected";

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  status: ReferralStatus;
  rewardXp: number;
  rewardCoins: number;
  adminNote?: string;
  createdAt: string;
  referredUser?: {
    id: string;
    username: string;
    createdAt: string;
  };
}

export interface ReferralMeStats {
  referralCode: string;
  referralLink: string;
  totalInvites: number;
  activeReferrals: number;
  pendingRewards: number;
  earnedRewards: number;
}

export interface ReferralMeResponse extends ReferralMeStats {
  history?: ReferralRecord[];
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
