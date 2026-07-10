import { SUPER_ADMIN_PERMISSIONS } from "./superAdminPermissions";

/** Super-admin-only permission slugs */
export const SUPER_ADMIN_ONLY_PERMISSIONS = [
  "system.full_access",
  "admins.manage",
  "roles.manage",
  "database.manage",
  "environment.manage",
  "api.manage",
] as const;

/** Standard admin — full panel access except super-admin-only operations */
export const STANDARD_ADMIN_PERMISSIONS = SUPER_ADMIN_PERMISSIONS.filter(
  (slug) => !(SUPER_ADMIN_ONLY_PERMISSIONS as readonly string[]).includes(slug)
);
