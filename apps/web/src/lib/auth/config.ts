/** Central auth route configuration — main Tasks.cash web app */

export const SESSION_COOKIE = "tc_session";

export const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
] as const;

/** Always public — never run protected-route redirects for these */
export const PUBLIC_LEGAL_PAGES = ["/privacy", "/terms", "/refund", "/cookies", "/help", "/faq"] as const;

/** Explicit protected routes only — everything else stays public for now */
export const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/video-hunter", "/explorer-dna"];

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

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isPublicLegalPage(pathname: string): boolean {
  return PUBLIC_LEGAL_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isProtectedPath(pathname: string): boolean {
  if (isAuthPage(pathname) || isPublicLegalPage(pathname)) return false;
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
