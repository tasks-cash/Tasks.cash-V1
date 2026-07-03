import { SpecialMissionModel } from "@/lib/server/models/SpecialMission";
import { connectDatabase } from "@/lib/server/db";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const BASE_RULES = [
  "Submit original proof only.",
  "Rewards are granted after admin review.",
  "Follow the required proof format exactly.",
];

/** Insert default missions when collection is empty — server-side seed only. */
export async function seedSpecialMissionsIfEmpty(): Promise<void> {
  await connectDatabase();
  const count = await SpecialMissionModel.countDocuments();
  if (count > 0) return;

  await SpecialMissionModel.create({
    title: "Create 100 Emails",
    description: "Generate and verify 100 unique email accounts for the portal outreach campaign.",
    category: "Email Ops",
    requiredProof: "Upload spreadsheet link or screenshot showing all 100 verified emails.",
    rules: [
      "All emails must be unique and verifiable.",
      "Submit a shareable spreadsheet or document link.",
      "Rewards issued after admin review only.",
    ],
    rewardXp: 1200,
    bronzeCoins: 80,
    silverCoins: 40,
    goldCoins: 15,
    deadline: daysFromNow(21),
    status: "open",
    difficulty: "Hard",
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Join Telegram Campaign",
    description: "Join the official Tasks.cash Telegram channel and complete the welcome verification flow.",
    category: "Social",
    requiredProof: "Telegram username plus screenshot of joined channel.",
    rewardXp: 350,
    bronzeCoins: 30,
    silverCoins: 10,
    goldCoins: 0,
    deadline: daysFromNow(14),
    status: "open",
    difficulty: "Easy",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Submit Research List",
    description: "Compile a curated list of 50 high-quality research sources for mystery mission planning.",
    category: "Research",
    requiredProof: "Google Sheet or document link with categorized sources.",
    rewardXp: 900,
    bronzeCoins: 50,
    silverCoins: 25,
    goldCoins: 8,
    deadline: daysFromNow(28),
    status: "open",
    difficulty: "Hard",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Complete Custom Task",
    description: "Execute a bespoke portal assignment issued by command — details provided after acceptance.",
    category: "Custom",
    requiredProof: "Written summary plus proof link or file reference as instructed.",
    rewardXp: 2500,
    bronzeCoins: 120,
    silverCoins: 80,
    goldCoins: 40,
    deadline: daysFromNow(45),
    status: "open",
    difficulty: "Legendary",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Data Collection Mission",
    description: "Collect structured data from assigned public sources and format for portal ingestion.",
    category: "Data",
    requiredProof: "CSV export link or validated data sheet.",
    rewardXp: 1500,
    bronzeCoins: 70,
    silverCoins: 45,
    goldCoins: 20,
    deadline: daysFromNow(30),
    status: "open",
    difficulty: "Epic",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "App Testing Mission",
    description: "Run through the challenge app flows and report bugs, UX issues, and performance notes.",
    category: "QA",
    requiredProof: "Testing report with steps, screenshots, and severity ratings.",
    rewardXp: 800,
    bronzeCoins: 45,
    silverCoins: 20,
    goldCoins: 5,
    deadline: daysFromNow(18),
    status: "open",
    difficulty: "Medium",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Website Feedback Mission",
    description: "Review tasks.cash public pages and submit actionable UX and content feedback.",
    category: "Feedback",
    requiredProof: "Document link with page-by-page feedback and improvement suggestions.",
    rewardXp: 600,
    bronzeCoins: 35,
    silverCoins: 15,
    goldCoins: 0,
    deadline: daysFromNow(12),
    status: "open",
    difficulty: "Medium",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Social Media Screenshot Proof",
    description: "Share portal content on your social platform and submit engagement proof.",
    category: "Social",
    requiredProof: "Screenshot of post plus public post URL.",
    rewardXp: 450,
    bronzeCoins: 25,
    silverCoins: 12,
    goldCoins: 3,
    deadline: daysFromNow(10),
    status: "open",
    difficulty: "Easy",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Short Video Idea Mission",
    description: "Pitch a short-form video concept aligned with Video Hunter campaign goals.",
    category: "Video",
    requiredProof: "Written idea title, hook, and target platform in proof field.",
    rewardXp: 700,
    bronzeCoins: 40,
    silverCoins: 18,
    goldCoins: 6,
    deadline: daysFromNow(16),
    status: "open",
    difficulty: "Medium",
    rules: BASE_RULES,
    isActive: true,
  });

  await SpecialMissionModel.create({
    title: "Community Invite Mission",
    description: "Invite active explorers to the portal and verify their first mission completion.",
    category: "Referral",
    requiredProof: "List of invited usernames and confirmation they completed onboarding.",
    rewardXp: 1100,
    bronzeCoins: 60,
    silverCoins: 35,
    goldCoins: 12,
    deadline: daysFromNow(25),
    status: "open",
    difficulty: "Hard",
    rules: BASE_RULES,
    isActive: true,
  });
}
