import { logger } from "./logger";

export type AuthEvent =
  | "login_success"
  | "login_failure"
  | "logout"
  | "password_reset"
  | "permission_denied"
  | "jwt_valid"
  | "jwt_invalid"
  | "session_expired"
  | "account_inactive";

/**
 * Auth/security logging — never pass passwords or tokens.
 */
export function logAuth(
  event: AuthEvent,
  fields: {
    accountType?: string;
    userId?: string;
    email?: string;
    role?: string;
    reason?: string;
    permission?: string;
    ip?: string;
  } = {}
): void {
  const level = event === "login_failure" || event === "permission_denied" || event === "jwt_invalid"
    ? "warn"
    : "info";

  const payload = {
    category: event === "permission_denied" || event === "login_failure" ? ("security" as const) : ("auth" as const),
    module: "auth",
    operation: event,
    event,
    status: event.includes("failure") || event.includes("denied") || event.includes("invalid") ? "denied" : "ok",
    accountType: fields.accountType,
    userId: fields.userId,
    // email is useful for login failure forensics but not a secret
    email: fields.email,
    role: fields.role,
    reason: fields.reason,
    permission: fields.permission,
    ip: fields.ip,
  };

  if (event === "jwt_valid") {
    logger.debug(`Auth ${event}`, payload);
    return;
  }

  if (level === "warn") logger.warn(`Auth ${event}`, payload);
  else logger.info(`Auth ${event}`, payload);
}
