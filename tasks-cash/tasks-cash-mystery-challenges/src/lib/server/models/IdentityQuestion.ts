import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { IdentityQuestionType } from "@/types/identity-challenge";

export interface IIdentityQuestionDoc extends Document {
  title: string;
  prompt: string;
  questionType: IdentityQuestionType;
  options: string[];
  xpReward: number;
  bronzeCoinsReward: number;
  silverCoinsReward: number;
  goldCoinsReward: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const identityQuestionSchema = new Schema<IIdentityQuestionDoc>(
  {
    title: { type: String, required: true, trim: true },
    prompt: { type: String, required: true, trim: true },
    questionType: {
      type: String,
      enum: ["short_text", "single_choice", "multiple_choice", "slider"],
      required: true,
    },
    options: { type: [String], default: [] },
    xpReward: { type: Number, default: 50, min: 0 },
    bronzeCoinsReward: { type: Number, default: 10, min: 0 },
    silverCoinsReward: { type: Number, default: 5, min: 0 },
    goldCoinsReward: { type: Number, default: 2, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true, collection: "identity_questions" }
);

export const IdentityQuestionModel: Model<IIdentityQuestionDoc> =
  mongoose.models.IdentityQuestion ??
  mongoose.model<IIdentityQuestionDoc>("IdentityQuestion", identityQuestionSchema);
