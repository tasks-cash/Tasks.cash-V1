import mongoose, { Document, Schema } from "mongoose";
import type { MissionDifficulty } from "@tasks-cash/types";

export interface IMissionDocument extends Document {
  title: string;
  description: string;
  difficulty: MissionDifficulty;
  coinReward: number;
  xpReward: number;
  category: string;
  requirements: string[];
  expiresAt?: Date;
  isActive: boolean;
  maxCompletions?: number;
  currentCompletions: number;
  createdAt: Date;
  updatedAt: Date;
}

const missionSchema = new Schema<IMissionDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "legendary"],
      default: "easy",
    },
    coinReward: { type: Number, required: true },
    xpReward: { type: Number, required: true },
    category: { type: String, default: "general" },
    requirements: [{ type: String }],
    expiresAt: Date,
    isActive: { type: Boolean, default: true },
    maxCompletions: Number,
    currentCompletions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Mission = mongoose.model<IMissionDocument>("Mission", missionSchema);
