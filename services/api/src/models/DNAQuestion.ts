import mongoose, { Document, Schema } from "mongoose";
import type { DNAModuleId, DNAQuestionType } from "@tasks-cash/types";

export interface IDNAQuestionDocument extends Document {
  prompt: string;
  category: DNAModuleId | "continuous";
  answerType: DNAQuestionType;
  options?: string[];
  xpReward: number;
  coinReward: number;
  enabled: boolean;
  order: number;
  unlockCondition?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dnaQuestionSchema = new Schema<IDNAQuestionDocument>(
  {
    prompt: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["identity", "skills", "platform", "device", "mission", "availability", "experience", "interest", "continuous"],
      default: "continuous",
    },
    answerType: {
      type: String,
      enum: [
        "short_text",
        "paragraph",
        "single_choice",
        "multiple_choice",
        "checkbox",
        "dropdown",
        "slider",
        "rating",
        "date",
        "file_upload",
      ],
      required: true,
    },
    options: [{ type: String }],
    xpReward: { type: Number, default: 50 },
    coinReward: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
    unlockCondition: { type: String },
  },
  { timestamps: true }
);

export const DNAQuestion = mongoose.model<IDNAQuestionDocument>("DNAQuestion", dnaQuestionSchema);
