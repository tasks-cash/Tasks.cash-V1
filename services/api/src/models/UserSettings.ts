import mongoose, { Document, Schema } from "mongoose";

export interface IUserSettingsDocument extends Document {
  userId: mongoose.Types.ObjectId;
  emailNotifications: boolean;
  pushNotifications: boolean;
  missionAlerts: boolean;
  referralAlerts: boolean;
  leaderboardVisible: boolean;
  theme: "dark" | "system";
  language: string;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettingsDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    missionAlerts: { type: Boolean, default: true },
    referralAlerts: { type: Boolean, default: true },
    leaderboardVisible: { type: Boolean, default: true },
    theme: { type: String, enum: ["dark", "system"], default: "dark" },
    language: { type: String, default: "en" },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const UserSettings = mongoose.model<IUserSettingsDocument>("UserSettings", userSettingsSchema);

export const DEFAULT_SETTINGS: {
  emailNotifications: boolean;
  pushNotifications: boolean;
  missionAlerts: boolean;
  referralAlerts: boolean;
  leaderboardVisible: boolean;
  theme: "dark" | "system";
  language: string;
} = {
  emailNotifications: true,
  pushNotifications: true,
  missionAlerts: true,
  referralAlerts: true,
  leaderboardVisible: true,
  theme: "dark" as const,
  language: "en",
};
