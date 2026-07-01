/** Explorer DNA — core platform intelligence system */

export type DNAQuestionType =
  | "text"
  | "country"
  | "number"
  | "time"
  | "textarea"
  | "short_text"
  | "paragraph"
  | "single_choice"
  | "multiple_choice"
  | "checkbox"
  | "dropdown"
  | "image_upload"
  | "slider"
  | "rating"
  | "date"
  | "file_upload";

export type DNAModuleId =
  | "identity"
  | "skills"
  | "platform"
  | "device"
  | "mission"
  | "availability"
  | "experience"
  | "interest";

export interface DNAModuleField {
  id: string;
  label: string;
  value?: string | string[];
  completed: boolean;
}

export interface IDNAModule {
  id: DNAModuleId;
  name: string;
  icon: string;
  description: string;
  fields: DNAModuleField[];
  completion: number;
  totalFields: number;
  completedFields: number;
}

export interface IDNAQuestion {
  id: string;
  prompt: string;
  title?: string;
  category: DNAModuleId | "continuous";
  answerType: DNAQuestionType;
  options?: string[];
  xpReward: number;
  coinReward?: number;
  enabled: boolean;
  order: number;
  unlockCondition?: string;
  isNew?: boolean;
}

export interface IDNAAnswer {
  id: string;
  userId: string;
  questionId: string;
  value: string | string[] | number;
  answeredAt: string;
}

export interface IDNARecommendation {
  id: string;
  missionId: string;
  title: string;
  matchScore: number;
  reason: string;
  rewardPreview: string;
  difficulty: string;
}

export interface DNAMatchScore {
  id: string;
  label: string;
  icon: string;
  score: number;
}

export interface ExplorerDNAProfile {
  completionPercent: number;
  completedModules: number;
  totalModules: number;
  intelligenceScore: number;
  nextReward: string;
  pendingQuestions: number;
  totalXpEarned: number;
  badges: string[];
}

export interface ExplorerDNAData {
  profile: ExplorerDNAProfile;
  modules: IDNAModule[];
  questions: IDNAQuestion[];
  answers: IDNAAnswer[];
  matchScores: DNAMatchScore[];
  recommendations: IDNARecommendation[];
}
