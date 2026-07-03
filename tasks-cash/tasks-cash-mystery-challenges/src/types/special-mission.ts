export type SpecialMissionStatus = "open" | "in_progress" | "closed" | "archived";
export type SpecialMissionDifficulty = "Easy" | "Medium" | "Hard" | "Epic" | "Legendary";
export type SpecialMissionSubmissionStatus = "pending_review" | "approved" | "rejected" | "rewarded";

export interface SpecialMission {
  id: string;
  title: string;
  description: string;
  category: string;
  requiredProof: string;
  rules: string[];
  rewardXp: number;
  bronzeCoins: number;
  silverCoins: number;
  goldCoins: number;
  deadline: string;
  status: SpecialMissionStatus;
  difficulty: SpecialMissionDifficulty;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialMissionSubmission {
  id: string;
  missionId: string;
  userId: string;
  proofText?: string;
  proofUrl?: string;
  proofFileUrl?: string;
  userNote?: string;
  status: SpecialMissionSubmissionStatus;
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use SpecialMissionSubmission */
export type SpecialMissionProof = SpecialMissionSubmission;

export interface SpecialMissionsPayload {
  missions: SpecialMission[];
  total: number;
}

export interface SpecialMissionDetailPayload {
  mission: SpecialMission;
  submissions: SpecialMissionSubmission[];
}
