import mongoose, { Schema, Document } from "mongoose";
import type { CounterKey } from "@tasks-cash/types";

export interface ICounterSettingDocument extends Document {
  key: CounterKey;
  label: string;
  value: number;
  isActive: boolean;
  incrementMin: number;
  incrementMax: number;
  intervalSeconds: number;
  lastUpdatedAt: Date;
}

const counterSettingSchema = new Schema<ICounterSettingDocument>(
  {
    key: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true },
    value: { type: Number, default: 0 },
    isActive: { type: Boolean, default: false },
    incrementMin: { type: Number, default: 1 },
    incrementMax: { type: Number, default: 3 },
    intervalSeconds: { type: Number, default: 5 },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CounterSetting = mongoose.model<ICounterSettingDocument>("CounterSetting", counterSettingSchema);
