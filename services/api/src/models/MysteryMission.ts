import mongoose, { Document, Schema } from "mongoose";
import type {
  MissionDifficulty,
  MysteryMissionCategory,
  MysteryMissionType,
  MysteryUnlockCondition,
  MysteryRewardType,
} from "@tasks-cash/types";

export interface IMysteryRewardDoc {
  type: MysteryRewardType;
  amount?: number;
  label?: string;
}

export interface IMysteryMissionDocument extends Document {
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  category: MysteryMissionCategory;
  missionType: MysteryMissionType;
  unlockCondition: MysteryUnlockCondition;
  unlockLabel?: string;
  rewards: IMysteryRewardDoc[];
  xpReward: number;
  coinReward: number;
  coinType?: "bronze" | "silver" | "gold";
  isHidden: boolean;
  isFeatured: boolean;
  isActive: boolean;
  expiresAt?: Date;
  scheduledAt?: Date;
  maxCompletions?: number;
  currentCompletions: number;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema<IMysteryRewardDoc>(
  {
    type: { type: String, required: true },
    amount: Number,
    label: String,
  },
  { _id: false }
);

const mysteryMissionSchema = new Schema<IMysteryMissionDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "epic", "legendary"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "daily", "weekly", "monthly", "special", "community", "referral",
        "video", "social_media", "ai", "hidden", "legendary", "founder",
      ],
      default: "hidden",
    },
    missionType: {
      type: String,
      enum: [
        "video_submission", "social_share", "telegram_join", "discord_join",
        "instagram_follow", "facebook_follow", "youtube_subscribe",
        "invite_friends", "complete_profile", "website_visit",
        "daily_login", "special_event", "manual_review",
      ],
      default: "manual_review",
    },
    unlockCondition: {
      type: String,
      enum: [
        "none", "level_5", "level_10", "invite_3_friends", "first_mission",
        "earn_1000_xp", "open_3_chests", "login_7_days", "founder", "special_event",
      ],
      default: "none",
    },
    unlockLabel: String,
    rewards: { type: [rewardSchema], default: [] },
    xpReward: { type: Number, default: 0 },
    coinReward: { type: Number, default: 0 },
    coinType: { type: String, enum: ["bronze", "silver", "gold"], default: "gold" },
    isHidden: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    expiresAt: Date,
    scheduledAt: Date,
    maxCompletions: Number,
    currentCompletions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MysteryMission = mongoose.model<IMysteryMissionDocument>(
  "MysteryMission",
  mysteryMissionSchema
);
