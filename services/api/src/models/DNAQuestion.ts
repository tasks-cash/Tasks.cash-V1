import mongoose, { Document, Schema } from "mongoose";
import type { DNAModuleId, DNAQuestionType } from "@tasks-cash/types";

export interface IDNAQuestionDocument extends Document {
  title: string;
  prompt: string;
  category: DNAModuleId | "continuous";
  answerType: DNAQuestionType;
  options: string[];
  required: boolean;
  difficulty: string;
  xpReward: number;
  bronzeCoinsReward: number;
  silverCoinsReward: number;
  goldCoinsReward: number;
  coinReward: number;
  enabled: boolean;
  order: number;
  unlockCondition?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ANSWER_TYPE_ENUM: DNAQuestionType[] = [
  "text",
  "country",
  "number",
  "time",
  "textarea",
  "short_text",
  "paragraph",
  "single_choice",
  "multiple_choice",
  "checkbox",
  "dropdown",
  "image_upload",
  "slider",
  "rating",
  "date",
  "file_upload",
];

const dnaQuestionSchema = new Schema<IDNAQuestionDocument>(
  {
    title: { type: String, trim: true, default: "" },
    prompt: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["identity", "skills", "platform", "device", "mission", "availability", "experience", "interest", "continuous"],
      default: "continuous",
    },
    answerType: {
      type: String,
      enum: ANSWER_TYPE_ENUM,
      required: true,
    },
    options: { type: [String], default: [] },
    required: { type: Boolean, default: false },
    difficulty: { type: String, default: "simple" },
    xpReward: { type: Number, default: 5 },
    bronzeCoinsReward: { type: Number, default: 1 },
    silverCoinsReward: { type: Number, default: 0 },
    goldCoinsReward: { type: Number, default: 0 },
    coinReward: { type: Number, default: 0 },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0, index: true },
    unlockCondition: { type: String },
  },
  { timestamps: true }
);

export const DNAQuestion = mongoose.model<IDNAQuestionDocument>("DNAQuestion", dnaQuestionSchema);
