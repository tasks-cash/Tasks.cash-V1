import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { VideoPlatform, VideoSubmissionStatus } from "@/types/video-submission";

export interface IVideoSubmissionDoc extends Document {
  userId: string;
  videoUrl: string;
  platform: VideoPlatform;
  visibleViews: number;
  ideaTitle: string;
  description: string;
  status: VideoSubmissionStatus;
  rewardXp: number;
  bronzeCoins: number;
  silverCoins: number;
  goldCoins: number;
  adminResponse?: string;
  submittedAt: Date;
}

const videoSubmissionSchema = new Schema<IVideoSubmissionDoc>(
  {
    userId: { type: String, required: true, index: true },
    videoUrl: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ["TikTok", "Instagram", "YouTube", "Facebook", "Snapchat", "X / Twitter", "Unknown"],
      default: "Unknown",
    },
    visibleViews: { type: Number, default: 0, min: 0 },
    ideaTitle: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "rewarded"],
      default: "pending",
    },
    rewardXp: { type: Number, default: 0 },
    bronzeCoins: { type: Number, default: 0 },
    silverCoins: { type: Number, default: 0 },
    goldCoins: { type: Number, default: 0 },
    adminResponse: { type: String },
    submittedAt: { type: Date, default: Date.now },
  },
  { collection: "challenge_video_submissions" }
);

export const VideoSubmissionModel: Model<IVideoSubmissionDoc> =
  mongoose.models.ChallengeVideoSubmission ??
  mongoose.model<IVideoSubmissionDoc>("ChallengeVideoSubmission", videoSubmissionSchema);
