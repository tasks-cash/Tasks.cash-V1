import mongoose, { Document, Schema } from "mongoose";
import type { RewardRarity, RewardType } from "@tasks-cash/types";

export interface IRewardDocument extends Document {
  name: string;
  description: string;
  type: RewardType;
  rarity: RewardRarity;
  value: number;
  requiredLevel: number;
  requiredCoins?: number;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema<IRewardDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["coins", "xp", "badge", "item", "multiplier"], required: true },
    rarity: { type: String, enum: ["common", "rare", "epic", "legendary"], default: "common" },
    value: { type: Number, required: true },
    requiredLevel: { type: Number, default: 1 },
    requiredCoins: Number,
    icon: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Reward = mongoose.model<IRewardDocument>("Reward", rewardSchema);
