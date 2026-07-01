import mongoose, { Document, Schema } from "mongoose";

export interface IDNARewardDocument extends Document {
  code: string;
  label: string;
  description: string;
  xpReward: number;
  bronzeReward: number;
  silverReward: number;
  goldReward: number;
  diamondReward: number;
  triggerType: "question" | "module" | "milestone" | "badge";
  triggerValue?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dnaRewardSchema = new Schema<IDNARewardDocument>(
  {
    code: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    xpReward: { type: Number, default: 0 },
    bronzeReward: { type: Number, default: 0 },
    silverReward: { type: Number, default: 0 },
    goldReward: { type: Number, default: 0 },
    diamondReward: { type: Number, default: 0 },
    triggerType: { type: String, enum: ["question", "module", "milestone", "badge"], default: "question" },
    triggerValue: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DNAReward = mongoose.model<IDNARewardDocument>("DNAReward", dnaRewardSchema);
