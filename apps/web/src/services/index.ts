import { apiFetch } from "@/lib/api";
import type { DashboardStats, IMission, IReward } from "@tasks-cash/types";

export const userService = {
  getDashboard: () => apiFetch<DashboardStats>("/api/users/dashboard"),
};

export const missionService = {
  list: () => apiFetch<IMission[]>("/api/missions"),
  complete: (id: string) =>
    apiFetch(`/api/missions/${id}/complete`, { method: "POST" }),
};

export const mysteryMissionService = {
  list: (category?: string) =>
    apiFetch<import("@tasks-cash/types").IMysteryMissionView[]>(
      `/api/mystery-missions${category ? `?category=${category}` : ""}`
    ),
  get: (id: string) =>
    apiFetch<import("@tasks-cash/types").IMysteryMissionView>(`/api/mystery-missions/${id}`),
  start: (id: string) =>
    apiFetch(`/api/mystery-missions/${id}/start`, { method: "POST" }),
};

export const rewardService = {
  list: () => apiFetch<IReward[]>("/api/rewards"),
};

export const walletService = {
  get: () => apiFetch("/api/wallet"),
};

export const notificationService = {
  list: () => apiFetch("/api/notifications"),
  unreadCount: () => apiFetch<{ count: number }>("/api/notifications/unread-count"),
};
