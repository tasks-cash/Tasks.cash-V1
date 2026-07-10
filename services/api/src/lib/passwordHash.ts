import type { IAdminDocument } from "../models/Admin";
import type { IUserDocument } from "../models/User";

type PasswordFields = {
  passwordHash?: string;
  password?: string;
  hashedPassword?: string;
};

/** Resolve bcrypt hash from document (canonical field: passwordHash). */
export function resolveStoredPasswordHash(doc: PasswordFields): string | null {
  return (
    doc.passwordHash?.trim() ||
    doc.hashedPassword?.trim() ||
    doc.password?.trim() ||
    null
  );
}

export const ADMIN_PORTAL_ROLES = new Set(["admin", "super_admin", "owner"]);

export function isAdminPortalRole(role: string | undefined): boolean {
  return ADMIN_PORTAL_ROLES.has(role ?? "");
}
