/** Full Super Admin permission slugs — stored on the owner account only */
export const SUPER_ADMIN_PERMISSIONS = [
  "system.full_access",
  "dashboard.access",
  "users.manage",
  "employees.manage",
  "admins.manage",
  "roles.manage",
  "missions.manage",
  "video_hunter.manage",
  "raid_arena.manage",
  "duel_arena.manage",
  "mystery_vault.manage",
  "rewards.manage",
  "referrals.manage",
  "counters.manage",
  "settings.manage",
  "database.manage",
  "system_logs.view",
  "notifications.manage",
  "environment.manage",
  "api.manage",
] as const;

export type SuperAdminPermission = (typeof SUPER_ADMIN_PERMISSIONS)[number];

export const SUPER_ADMIN_ROLE_NAME = "Super Admin";
