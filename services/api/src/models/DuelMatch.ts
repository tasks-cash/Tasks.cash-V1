import mongoose, { Document, Schema } from "mongoose";

export type DuelStatus = "open" | "active" | "completed";

export interface IDuelMatchDocument extends Document {
  title: string;
  challenger: string;
  opponent?: string;
  stakePreview: string;
  status: DuelStatus;
  rewardPreview: string;
  enabled: boolean;
  order: number;
}

const duelMatchSchema = new Schema<IDuelMatchDocument>(
  {
    title: { type: String, required: true, trim: true },
    challenger: { type: String, required: true },
    opponent: { type: String },
    stakePreview: { type: String, default: "" },
    status: { type: String, enum: ["open", "active", "completed"], default: "open" },
    rewardPreview: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DuelMatch = mongoose.model<IDuelMatchDocument>("DuelMatch", duelMatchSchema);
