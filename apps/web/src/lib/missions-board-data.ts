import type { MissionDifficulty } from "@tasks-cash/types";

export type MissionBoardStatus = "available" | "locked" | "under_review" | "completed";

export interface MissionBoardItem {
  id: string;
  title: string;
  status: MissionBoardStatus;
  difficulty: MissionDifficulty;
  rewardPreview: string;
  unlockRequirement: string;
  description: string;
  viewHref?: string;
}

export const MISSION_BOARD_STATS = {
  totalCompleted: 9876,
  pendingSubmissions: 432,
  rewardsEarned: "$12,480",
  withdrawalsCompleted: 2145,
} as const;

export const MISSION_BOARD_ITEMS: MissionBoardItem[] = [
  {
    id: "first-trial",
    title: "FIRST TRIAL: PROVE YOUR REACH",
    status: "available",
    difficulty: "hard",
    rewardPreview: "$500 + 1,000 XP",
    unlockRequirement: "Submit a video link with 10K+ views and complete your personal information.",
    description:
      "Prove your reach across the portal network. Submit verified video performance and finalize your explorer profile.",
    viewHref: "/dashboard/missions/submit",
  },
  {
    id: "shadow-mission",
    title: "SHADOW MISSION",
    status: "locked",
    difficulty: "medium",
    rewardPreview: "Mystery Cache + 750 XP",
    unlockRequirement: "Locked until Level 5.",
    description: "A classified operation hidden in the shadow archive. Reach Level 5 to reveal the full briefing.",
  },
  {
    id: "referral-gate",
    title: "REFERRAL GATE",
    status: "locked",
    difficulty: "medium",
    rewardPreview: "$250 + Referral Bonus",
    unlockRequirement: "Invite 3 friends to unlock.",
    description: "Open the referral gate by bringing three allies into the portal.",
  },
  {
    id: "daily-mystery",
    title: "DAILY MYSTERY MISSION",
    status: "locked",
    difficulty: "easy",
    rewardPreview: "Daily Mystery Box",
    unlockRequirement: "Unlocks after daily login streak.",
    description: "A rotating daily challenge sealed until your login streak is established.",
  },
  {
    id: "legendary-mission",
    title: "LEGENDARY MISSION",
    status: "locked",
    difficulty: "legendary",
    rewardPreview: "Legendary Chest + $2,000",
    unlockRequirement: "Locked until Level 10.",
    description: "The ultimate portal trial reserved for elite explorers who reach Level 10.",
  },
];

export const MISSION_STATUS_LABELS: Record<MissionBoardStatus, string> = {
  available: "Available",
  locked: "Locked",
  under_review: "Under Review",
  completed: "Completed",
};
