import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { SpecialMissionDifficulty, SpecialMissionStatus } from "@/types/special-mission";

export interface ISpecialMissionDoc extends Document {
  title: string;
  description: string;
  category: string;
  requiredProof: string;
  rules: string[];
  rewardXp: number;
  bronzeCoins: number;
  silverCoins: number;
  goldCoins: number;
  deadline: Date;
  status: SpecialMissionStatus;
  difficulty: SpecialMissionDifficulty;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const specialMissionSchema = new Schema<ISpecialMissionDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    requiredProof: { type: String, required: true, trim: true },
    rules: { type: [String], default: [] },
    rewardXp: { type: Number, default: 0, min: 0 },
    bronzeCoins: { type: Number, default: 0, min: 0 },
    silverCoins: { type: Number, default: 0, min: 0 },
    goldCoins: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "closed", "archived"],
      default: "open",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Epic", "Legendary"],
      default: "Medium",
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "challenge_special_missions" }
);

export const SpecialMissionModel: Model<ISpecialMissionDoc> =
  mongoose.models.ChallengeSpecialMission ??
  mongoose.model<ISpecialMissionDoc>("ChallengeSpecialMission", specialMissionSchema);
