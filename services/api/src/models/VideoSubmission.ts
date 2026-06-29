import mongoose, { Document, Schema } from "mongoose";
import type { VideoPlatform, VideoSubmissionStatus } from "@tasks-cash/types";

export interface IVideoSubmissionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  videoUrl: string;
  platform: VideoPlatform;
  visibleViews: number;
  screenshotProofUrl?: string;
  description?: string;
  status: VideoSubmissionStatus;
  rewardXp: number;
  bronzeCoins: number;
  silverCoins: number;
  goldCoins: number;
  diamondGems: number;
  adminResponse?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
}

const videoSubmissionSchema = new Schema<IVideoSubmissionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    videoUrl: { type: String, required: true, trim: true },
    platform: {
      type: String,
      enum: ["tiktok", "instagram", "youtube", "facebook", "snapchat", "twitter", "unknown"],
      default: "unknown",
    },
    visibleViews: { type: Number, default: 0, min: 0 },
    screenshotProofUrl: { type: String },
    description: { type: String, maxlength: 2000 },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "rewarded"],
      default: "pending",
    },
    rewardXp: { type: Number, default: 0 },
    bronzeCoins: { type: Number, default: 0 },
    silverCoins: { type: Number, default: 0 },
    goldCoins: { type: Number, default: 0 },
    diamondGems: { type: Number, default: 0 },
    adminResponse: { type: String },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: false }
);

export const VideoSubmission = mongoose.model<IVideoSubmissionDocument>(
  "VideoSubmission",
  videoSubmissionSchema
);
