import type { ExplorerDNAData, IDNAAnswer, IDNAQuestion } from "@tasks-cash/types";

const BASE_DNA_DATA: ExplorerDNAData = {
  profile: {
    completionPercent: 72,
    completedModules: 18,
    totalModules: 25,
    intelligenceScore: 847,
    nextReward: "+150 XP · DNA Insight Badge at 75%",
    pendingQuestions: 3,
    totalXpEarned: 4200,
    badges: ["Early Explorer", "DNA Pioneer"],
  },
  modules: [
    {
      id: "identity",
      name: "Identity DNA",
      icon: "🪪",
      description: "Who you are in the portal network.",
      completion: 100,
      totalFields: 5,
      completedFields: 5,
      fields: [
        { id: "name", label: "Name", value: "VoidHunter", completed: true },
        { id: "nickname", label: "Nickname", value: "Void", completed: true },
        { id: "country", label: "Country", value: "United Arab Emirates", completed: true },
        { id: "language", label: "Language", value: "English, Arabic", completed: true },
        { id: "timezone", label: "Time Zone", value: "GMT+4", completed: true },
      ],
    },
    {
      id: "skills",
      name: "Skills DNA",
      icon: "⚡",
      description: "Your professional and creative capabilities.",
      completion: 75,
      totalFields: 8,
      completedFields: 6,
      fields: [
        { id: "programming", label: "Programming", value: "Intermediate", completed: true },
        { id: "ai", label: "AI", value: "Advanced", completed: true },
        { id: "design", label: "Design", value: "Beginner", completed: true },
        { id: "video", label: "Video Editing", value: "Advanced", completed: true },
        { id: "writing", label: "Writing", value: "Intermediate", completed: true },
        { id: "translation", label: "Translation", value: "English ↔ Arabic", completed: true },
        { id: "research", label: "Research", value: "", completed: false },
        { id: "marketing", label: "Marketing", value: "", completed: false },
      ],
    },
    {
      id: "platform",
      name: "Platform DNA",
      icon: "📱",
      description: "Social platforms you operate on.",
      completion: 83,
      totalFields: 6,
      completedFields: 5,
      fields: [
        { id: "tiktok", label: "TikTok", value: "Primary", completed: true },
        { id: "youtube", label: "YouTube", value: "Active", completed: true },
        { id: "instagram", label: "Instagram", value: "Active", completed: true },
        { id: "facebook", label: "Facebook", value: "Occasional", completed: true },
        { id: "snapchat", label: "Snapchat", value: "—", completed: true },
        { id: "twitter", label: "X", value: "", completed: false },
      ],
    },
    {
      id: "device",
      name: "Device DNA",
      icon: "💻",
      description: "Devices and operating systems you use.",
      completion: 80,
      totalFields: 5,
      completedFields: 4,
      fields: [
        { id: "android", label: "Android", value: "Samsung S24", completed: true },
        { id: "iphone", label: "iPhone", value: "—", completed: true },
        { id: "windows", label: "Windows", value: "Primary PC", completed: true },
        { id: "macos", label: "macOS", value: "MacBook Pro", completed: true },
        { id: "linux", label: "Linux", value: "", completed: false },
      ],
    },
    {
      id: "mission",
      name: "Mission DNA",
      icon: "🎯",
      description: "Favorite mission types and play style.",
      completion: 60,
      totalFields: 3,
      completedFields: 2,
      fields: [
        { id: "video", label: "Video Hunter", value: "Favorite", completed: true },
        { id: "research", label: "Research Missions", value: "Interested", completed: true },
        { id: "referral", label: "Referral Arena", value: "", completed: false },
      ],
    },
    {
      id: "availability",
      name: "Availability DNA",
      icon: "🕐",
      description: "When you can work in the portal.",
      completion: 50,
      totalFields: 2,
      completedFields: 1,
      fields: [
        { id: "hours", label: "Working Hours", value: "6–10 PM GMT+4", completed: true },
        { id: "weekly", label: "Weekly Capacity", value: "", completed: false },
      ],
    },
    {
      id: "experience",
      name: "Experience DNA",
      icon: "🏆",
      description: "Your overall explorer experience level.",
      completion: 100,
      totalFields: 1,
      completedFields: 1,
      fields: [{ id: "level", label: "Experience Level", value: "Advanced", completed: true }],
    },
    {
      id: "interest",
      name: "Interest DNA",
      icon: "✨",
      description: "Topics and domains that drive you.",
      completion: 67,
      totalFields: 6,
      completedFields: 4,
      fields: [
        { id: "gaming", label: "Gaming", value: "High", completed: true },
        { id: "crypto", label: "Crypto", value: "Medium", completed: true },
        { id: "business", label: "Business", value: "High", completed: true },
        { id: "ai", label: "AI", value: "Very High", completed: true },
        { id: "education", label: "Education", value: "", completed: false },
        { id: "technology", label: "Technology", value: "", completed: false },
      ],
    },
  ],
  questions: [
    {
      id: "q-platform-most",
      prompt: "Which platform do you use most?",
      category: "platform",
      answerType: "single_choice",
      options: ["TikTok", "YouTube", "Instagram", "Facebook", "Snapchat", "X"],
      xpReward: 50,
      coinReward: 25,
      enabled: true,
      order: 1,
      isNew: true,
    },
    {
      id: "q-edit-videos",
      prompt: "Can you edit videos?",
      category: "skills",
      answerType: "single_choice",
      options: ["Yes, professionally", "Yes, basic editing", "Learning", "No"],
      xpReward: 40,
      enabled: true,
      order: 2,
      isNew: true,
    },
    {
      id: "q-weekly-hours",
      prompt: "How many hours can you work weekly?",
      category: "availability",
      answerType: "slider",
      xpReward: 60,
      enabled: true,
      order: 3,
      isNew: true,
    },
    {
      id: "q-programming",
      prompt: "Do you have programming experience?",
      category: "skills",
      answerType: "rating",
      xpReward: 45,
      enabled: true,
      order: 4,
    },
    {
      id: "q-excel",
      prompt: "Can you use Excel?",
      category: "skills",
      answerType: "single_choice",
      options: ["Expert", "Intermediate", "Basic", "No"],
      xpReward: 35,
      enabled: true,
      order: 5,
    },
    {
      id: "q-english",
      prompt: "Can you communicate in English?",
      category: "identity",
      answerType: "single_choice",
      options: ["Fluent", "Conversational", "Basic", "No"],
      xpReward: 30,
      enabled: true,
      order: 6,
    },
  ],
  answers: [],
  matchScores: [
    { id: "video-hunter", label: "Video Hunter", icon: "🎥", score: 95 },
    { id: "referral-arena", label: "Referral Arena", icon: "🤝", score: 82 },
    { id: "research", label: "Research Missions", icon: "🔬", score: 67 },
    { id: "ai-missions", label: "AI Missions", icon: "🧠", score: 73 },
    { id: "remote-device", label: "Remote Device Missions", icon: "📱", score: 89 },
  ],
  recommendations: [
    {
      id: "rec-1",
      missionId: "vh-premium",
      title: "Submit 50 Valid Video Links",
      matchScore: 95,
      reason: "Strong Platform DNA + Video Editing skills",
      rewardPreview: "1,200 Gold + Video Master Badge",
      difficulty: "Hard",
    },
    {
      id: "rec-2",
      missionId: "ref-growth",
      title: "Invite 25 Active Users",
      matchScore: 82,
      reason: "Referral interest + Business DNA alignment",
      rewardPreview: "800 Gold + Referral King Title",
      difficulty: "Hard",
    },
    {
      id: "rec-3",
      missionId: "ai-research",
      title: "Complete AI Research List",
      matchScore: 73,
      reason: "AI interest + Research skill gap to fill",
      rewardPreview: "450 Gold + Intelligence XP",
      difficulty: "Medium",
    },
    {
      id: "rec-4",
      missionId: "device-remote",
      title: "Remote Device Verification",
      matchScore: 89,
      reason: "Multi-device DNA + high availability",
      rewardPreview: "600 Gold + Device Badge",
      difficulty: "Medium",
    },
  ],
};

let questions: IDNAQuestion[] = BASE_DNA_DATA.questions.map((q) => ({ ...q }));
const userAnswers = new Map<string, Map<string, IDNAAnswer>>();
const userStats = new Map<string, { completionPercent: number; intelligenceScore: number; totalXpEarned: number }>();

function defaultStats() {
  return {
    completionPercent: BASE_DNA_DATA.profile.completionPercent,
    intelligenceScore: BASE_DNA_DATA.profile.intelligenceScore,
    totalXpEarned: BASE_DNA_DATA.profile.totalXpEarned,
  };
}

function getUserStats(userId: string) {
  if (!userStats.has(userId)) userStats.set(userId, defaultStats());
  return userStats.get(userId)!;
}

export function listQuestions(): IDNAQuestion[] {
  return [...questions].sort((a, b) => a.order - b.order);
}

export function replaceQuestions(next: IDNAQuestion[]): void {
  questions = next.map((q) => ({ ...q }));
}

export function upsertQuestion(question: IDNAQuestion): IDNAQuestion {
  const idx = questions.findIndex((q) => q.id === question.id);
  if (idx >= 0) {
    questions[idx] = { ...questions[idx], ...question };
    return questions[idx];
  }
  questions.push({ ...question, order: question.order || questions.length + 1 });
  return question;
}

export function deleteQuestion(id: string): boolean {
  const before = questions.length;
  questions = questions.filter((q) => q.id !== id);
  return questions.length < before;
}

export function getUserDnaData(userId: string): ExplorerDNAData {
  const answered = userAnswers.get(userId) ?? new Map<string, IDNAAnswer>();
  const stats = getUserStats(userId);
  const enabledQuestions = questions.filter((q) => q.enabled);
  const pending = enabledQuestions.filter((q) => !answered.has(q.id)).length;

  return {
    profile: {
      ...BASE_DNA_DATA.profile,
      completionPercent: stats.completionPercent,
      intelligenceScore: stats.intelligenceScore,
      totalXpEarned: stats.totalXpEarned,
      pendingQuestions: pending,
    },
    modules: BASE_DNA_DATA.modules,
    questions: enabledQuestions.map((q) => ({
      ...q,
      isNew: !answered.has(q.id),
    })),
    answers: Array.from(answered.values()),
    matchScores: BASE_DNA_DATA.matchScores,
    recommendations: BASE_DNA_DATA.recommendations,
  };
}

export function submitDnaAnswer(
  userId: string,
  questionId: string,
  value: string | string[] | number
): {
  answer: IDNAAnswer;
  xpAwarded: number;
  coinsAwarded: number;
  completionDelta: number;
  intelligenceDelta: number;
} | null {
  const question = questions.find((q) => q.id === questionId && q.enabled);
  if (!question) return null;

  const answered = userAnswers.get(userId) ?? new Map<string, IDNAAnswer>();
  if (answered.has(questionId)) return null;

  const answer: IDNAAnswer = {
    id: `ans_${userId}_${questionId}`,
    userId,
    questionId,
    value,
    answeredAt: new Date().toISOString(),
  };

  answered.set(questionId, answer);
  userAnswers.set(userId, answered);

  const stats = getUserStats(userId);
  const xpAwarded = question.xpReward;
  const coinsAwarded = question.coinReward ?? 0;
  const completionDelta = 1;
  const intelligenceDelta = 12;

  stats.totalXpEarned += xpAwarded;
  stats.intelligenceScore += intelligenceDelta;
  stats.completionPercent = Math.min(100, stats.completionPercent + completionDelta);

  return { answer, xpAwarded, coinsAwarded, completionDelta, intelligenceDelta };
}
