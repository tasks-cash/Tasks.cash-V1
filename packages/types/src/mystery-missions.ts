/** Mystery Missions — hidden archive mission system */

export type MysteryMissionCategory =
  | "daily"
  | "weekly"
  | "monthly"
  | "special"
  | "community"
  | "referral"
  | "video"
  | "social_media"
  | "ai"
  | "hidden"
  | "legendary"
  | "founder";

export type MysteryPlayerState =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "completed"
  | "expired";

export type MysteryUnlockCondition =
  | "none"
  | "level_5"
  | "level_10"
  | "invite_3_friends"
  | "first_mission"
  | "earn_1000_xp"
  | "open_3_chests"
  | "login_7_days"
  | "founder"
  | "special_event";

export type MysteryMissionType =
  | "video_submission"
  | "social_share"
  | "telegram_join"
  | "discord_join"
  | "instagram_follow"
  | "facebook_follow"
  | "youtube_subscribe"
  | "invite_friends"
  | "complete_profile"
  | "website_visit"
  | "daily_login"
  | "special_event"
  | "manual_review";

export type MysteryRewardType =
  | "xp"
  | "bronze_coins"
  | "silver_coins"
  | "gold_coins"
  | "diamond_gems"
  | "legend_tokens"
  | "treasure_chest"
  | "mystery_box"
  | "founder_badge"
  | "secret_badge";

export interface IMysteryReward {
  type: MysteryRewardType;
  amount?: number;
  label?: string;
}

export interface IMysteryMission {
  _id: string;
  title: string;
  description: string;
  difficulty: import("./index").MissionDifficulty;
  category: MysteryMissionCategory;
  missionType: MysteryMissionType;
  unlockCondition: MysteryUnlockCondition;
  unlockLabel?: string;
  rewards: IMysteryReward[];
  xpReward: number;
  coinReward: number;
  coinType?: "bronze" | "silver" | "gold";
  isHidden: boolean;
  isFeatured: boolean;
  isActive: boolean;
  expiresAt?: Date | string;
  scheduledAt?: Date | string;
  maxCompletions?: number;
  currentCompletions: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/** Mission with computed player state for UI */
export interface IMysteryMissionView extends IMysteryMission {
  playerState: MysteryPlayerState;
  isRevealed: boolean;
}

export const MYSTERY_CATEGORY_LABELS: Record<MysteryMissionCategory, string> = {
  daily: "Daily Missions",
  weekly: "Weekly Missions",
  monthly: "Monthly Missions",
  special: "Special Missions",
  community: "Community Missions",
  referral: "Referral Missions",
  video: "Video Missions",
  social_media: "Social Media Missions",
  ai: "AI Missions",
  hidden: "Hidden Missions",
  legendary: "Legendary Missions",
  founder: "Founder Missions",
};

export const MYSTERY_UNLOCK_LABELS: Record<MysteryUnlockCondition, string> = {
  none: "Always Available",
  level_5: "Reach Level 5",
  level_10: "Reach Level 10",
  invite_3_friends: "Invite 3 Friends",
  first_mission: "Complete First Mission",
  earn_1000_xp: "Earn 1,000 XP",
  open_3_chests: "Open 3 Treasure Chests",
  login_7_days: "Login for 7 Days",
  founder: "Become Founder",
  special_event: "Special Event",
};

export const MYSTERY_STATE_LABELS: Record<MysteryPlayerState, string> = {
  locked: "Locked",
  unlocked: "Unlocked",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  completed: "Completed",
  expired: "Expired",
};

export const MYSTERY_REWARD_LABELS: Record<MysteryRewardType, string> = {
  xp: "XP",
  bronze_coins: "Bronze Coins",
  silver_coins: "Silver Coins",
  gold_coins: "Gold Coins",
  diamond_gems: "Diamond Gems",
  legend_tokens: "Legend Tokens",
  treasure_chest: "Treasure Chest",
  mystery_box: "Mystery Box",
  founder_badge: "Founder Badge",
  secret_badge: "Secret Badge",
};

export const MYSTERY_MISSION_TYPE_LABELS: Record<MysteryMissionType, string> = {
  video_submission: "Video Submission",
  social_share: "Social Share",
  telegram_join: "Telegram Join",
  discord_join: "Discord Join",
  instagram_follow: "Instagram Follow",
  facebook_follow: "Facebook Follow",
  youtube_subscribe: "YouTube Subscribe",
  invite_friends: "Invite Friends",
  complete_profile: "Complete Profile",
  website_visit: "Website Visit",
  daily_login: "Daily Login",
  special_event: "Special Event",
  manual_review: "Manual Review",
};
