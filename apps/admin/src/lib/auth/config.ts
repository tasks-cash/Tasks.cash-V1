export const SESSION_COOKIE = "tc_session";

export type AppRole =
  | "guest"
  | "user"
  | "moderator"
  | "employee"
  | "team_leader"
  | "admin"
  | "super_admin"
  | "owner";

export const ROLE_RANK: Record<AppRole, number> = {
  guest: 0,
  user: 1,
  moderator: 2,
  employee: 3,
  team_leader: 4,
  admin: 5,
  super_admin: 6,
  owner: 7,
};

export function normalizeRole(role?: string | null): AppRole {
  const r = (role ?? "guest").toLowerCase().replace(/-/g, "_") as AppRole;
  return r in ROLE_RANK ? r : "user";
}

export function hasMinRole(userRole: string | undefined, minRole: AppRole): boolean {
  return ROLE_RANK[normalizeRole(userRole)] >= ROLE_RANK[minRole];
}
