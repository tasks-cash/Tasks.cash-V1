import mongoose, { Document, Schema } from "mongoose";
import type { DNAModuleId } from "@tasks-cash/types";

export interface IDNAModuleFieldDoc {
  id: string;
  label: string;
  completed: boolean;
}

export interface IDNAModuleDocument extends Document {
  moduleId: DNAModuleId;
  name: string;
  icon: string;
  description: string;
  fields: IDNAModuleFieldDoc[];
  enabled: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const dnaModuleSchema = new Schema<IDNAModuleDocument>(
  {
    moduleId: {
      type: String,
      enum: ["identity", "skills", "platform", "device", "mission", "availability", "experience", "interest"],
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    icon: { type: String, default: "🧬" },
    description: { type: String, default: "" },
    fields: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const DNAModule = mongoose.model<IDNAModuleDocument>("DNAModule", dnaModuleSchema);
