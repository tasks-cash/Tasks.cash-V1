import mongoose, { Document, Schema } from "mongoose";
import type { ReferralStatus } from "@tasks-cash/types";

export interface IReferralDocument extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  referralCode: string;
  status: ReferralStatus;
  rewardXp: number;
  rewardCoins: number;
  bonusCoins: number;
  adminNote?: string;
  activatedAt?: Date;
  rewardedAt?: Date;
  createdAt: Date;
}

const referralSchema = new Schema<IReferralDocument>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    referralCode: { type: String, required: true, uppercase: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "active", "rewarded", "rejected"],
      default: "pending",
    },
    rewardXp: { type: Number, default: 0 },
    rewardCoins: { type: Number, default: 0 },
    bonusCoins: { type: Number, default: 50 },
    adminNote: { type: String },
    activatedAt: { type: Date },
    rewardedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Referral = mongoose.model<IReferralDocument>("Referral", referralSchema);
