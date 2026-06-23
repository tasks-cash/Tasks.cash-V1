"use client";

import type { INotification, NotificationType } from "@tasks-cash/types";
import { Badge } from "./components/ui/badge";
import { cn } from "./lib/utils";

const TYPE_ICONS: Record<NotificationType, string> = {
  mission_complete: "⚔️",
  level_up: "⚡",
  referral_bonus: "🔗",
  reward_claimed: "🎁",
  admin_message: "📜",
  system: "◈",
  achievement_unlocked: "🏅",
  badge_earned: "🎖️",
  treasure_found: "📦",
  live_reward: "✨",
  stat_level_up: "📈",
  event_reward: "🌍",
};

interface NotificationItemProps {
  notification: INotification;
  onMarkRead?: (id: string) => void;
  className?: string;
}

export function NotificationItem({ notification, onMarkRead, className }: NotificationItemProps) {
  const icon = TYPE_ICONS[notification.type] ?? "◈";

  return (
    <button
      type="button"
      onClick={() => !notification.read && onMarkRead?.(notification._id)}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all",
        notification.read
          ? "border-purple-500/10 bg-purple-950/20 opacity-70"
          : "border-purple-500/30 bg-purple-950/40 hover:border-purple-400/40",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-white text-sm truncate">{notification.title}</p>
            {!notification.read && <Badge variant="gold">New</Badge>}
          </div>
          <p className="text-purple-300/60 text-xs line-clamp-2">{notification.message}</p>
          <p className="text-purple-500/40 text-xs mt-2">
            {new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </button>
  );
}
