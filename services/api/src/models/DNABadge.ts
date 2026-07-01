import mongoose, { Document, Schema } from "mongoose";

export interface IDNABadgeDocument extends Document {
  code: string;
  label: string;
  description: string;
  icon: string;
  requiredCompletion: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dnaBadgeSchema = new Schema<IDNABadgeDocument>(
  {
    code: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "🏅" },
    requiredCompletion: { type: Number, default: 25 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DNABadge = mongoose.model<IDNABadgeDocument>("DNABadge", dnaBadgeSchema);
