export type IdentityQuestionType =
  | "short_text"
  | "single_choice"
  | "multiple_choice"
  | "slider";

export interface IdentityQuestion {
  id: string;
  title: string;
  prompt: string;
  questionType: IdentityQuestionType;
  options: string[];
  xpReward: number;
  bronzeCoinsReward: number;
  silverCoinsReward: number;
  goldCoinsReward: number;
  isActive: boolean;
  displayOrder: number;
  answered: boolean;
  answer?: string;
}

export interface IdentityChallengeProgress {
  answered: number;
  total: number;
}

export interface IdentityChallengePayload {
  questions: IdentityQuestion[];
  progress: IdentityChallengeProgress;
}

export interface IdentityAnswerResult {
  answerId: string;
  questionId: string;
  rewardClaimed: boolean;
  rewards: {
    xp: number;
    bronzeCoins: number;
    silverCoins: number;
    goldCoins: number;
  };
  progress: IdentityChallengeProgress;
}
