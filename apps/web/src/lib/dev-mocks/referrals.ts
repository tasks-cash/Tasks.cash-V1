import type { IReferralMeResponse } from "@tasks-cash/types";

export const DEV_MOCK_REFERRAL_ME: IReferralMeResponse = {
  referralCode: "VOID-7X9K",
  referralLink: "http://localhost:3000/register?ref=VOID-7X9K",
  totalInvites: 2,
  activeReferrals: 1,
  pendingRewards: 500,
  earnedRewards: 500,
  history: [
    {
      id: "mock_ref_1",
      referrerId: "mock_user",
      referredUserId: "mock_user_1",
      referralCode: "VOID-7X9K",
      status: "active",
      rewardXp: 100,
      rewardCoins: 500,
      adminNote: "Verified active explorer",
      createdAt: "2026-05-10T00:00:00.000Z",
      activatedAt: "2026-05-12T00:00:00.000Z",
      referredUser: { id: "mock_user_1", username: "SarahK", createdAt: "2026-05-10T00:00:00.000Z" },
    },
    {
      id: "mock_ref_2",
      referrerId: "mock_user",
      referredUserId: "mock_user_2",
      referralCode: "VOID-7X9K",
      status: "pending",
      rewardXp: 0,
      rewardCoins: 0,
      createdAt: "2026-06-15T00:00:00.000Z",
      referredUser: { id: "mock_user_2", username: "AhmedR", createdAt: "2026-06-15T00:00:00.000Z" },
    },
  ],
};
