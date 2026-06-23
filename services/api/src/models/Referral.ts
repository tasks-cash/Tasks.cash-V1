import mongoose, { Document, Schema } from "mongoose";

export interface IReferralDocument extends Document {
  referrerId: mongoose.Types.ObjectId;
  referredUserId: mongoose.Types.ObjectId;
  bonusCoins: number;
  createdAt: Date;
}

const referralSchema = new Schema<IReferralDocument>(
  {
    referrerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    referredUserId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    bonusCoins: { type: Number, default: 50 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Referral = mongoose.model<IReferralDocument>("Referral", referralSchema);
