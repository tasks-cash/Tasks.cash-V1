import type { NotificationType } from "@tasks-cash/types";
import { Notification } from "../models/Notification";
import { UserSettings, DEFAULT_SETTINGS } from "../models/UserSettings";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/** Create a notification for a user (respects user alert preferences) */
export async function createNotification(input: CreateNotificationInput) {
  const settings = await UserSettings.findOne({ userId: input.userId });

  if (settings) {
    if (input.type === "mission_complete" && !settings.missionAlerts) return null;
    if (input.type === "referral_bonus" && !settings.referralAlerts) return null;
    if (!settings.pushNotifications && input.type !== "admin_message") return null;
  }

  return Notification.create(input);
}

export async function getUserNotifications(userId: string, limit = 50) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
}

export async function getUnreadCount(userId: string) {
  return Notification.countDocuments({ userId, read: false });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { read: true },
    { new: true }
  );
}

export async function markAllNotificationsRead(userId: string) {
  await Notification.updateMany({ userId, read: false }, { read: true });
}

export async function getOrCreateUserSettings(userId: string) {
  let settings = await UserSettings.findOne({ userId });
  if (!settings) {
    settings = await UserSettings.create({ userId, ...DEFAULT_SETTINGS });
  }
  return settings;
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<typeof DEFAULT_SETTINGS>
) {
  return UserSettings.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true }
  );
}
