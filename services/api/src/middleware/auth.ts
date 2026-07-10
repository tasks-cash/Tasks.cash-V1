import { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { User, IUserDocument } from "../models/User";
import { Admin, IAdminDocument } from "../models/Admin";
import { isDbConnected } from "../config/database";
import { isAdminPortalRole } from "../lib/passwordHash";

export type AccountType = "user" | "admin";

export interface AuthRequest extends Request {
  user?: IUserDocument;
  admin?: IAdminDocument;
  accountType?: AccountType;
}

interface JwtPayload {
  userId: string;
  email?: string;
  role: string;
  accountType?: AccountType;
}

export type AppRole =
  | "guest"
  | "user"
  | "moderator"
  | "employee"
  | "team_leader"
  | "admin"
  | "super_admin"
  | "owner";

const ROLE_RANK: Record<AppRole, number> = {
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

function extractBearerToken(req: AuthRequest): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim() || null;
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)tasks_cash_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Verify JWT and attach user or admin account to request */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const secret = process.env.JWT_SECRET ?? "dev-secret";

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    const accountType: AccountType = payload.accountType === "admin" ? "admin" : "user";

    if (!isDbConnected()) {
      res.status(503).json({ success: false, error: "Database unavailable" });
      return;
    }

    if (accountType === "admin") {
      const admin = await Admin.findById(payload.userId).select("-passwordHash");
      if (!admin) {
        res.status(401).json({ success: false, error: "Admin not found" });
        return;
      }
      if (admin.status !== "active") {
        res.status(403).json({ success: false, error: "Account is not active" });
        return;
      }
      req.admin = admin;
      req.accountType = "admin";
      next();
      return;
    }

    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }
    req.user = user;
    req.accountType = "user";
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
}

/** Require admin account token with portal role */
export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.accountType !== "admin" || !req.admin || !isAdminPortalRole(req.admin.role)) {
    res.status(403).json({ success: false, error: "Admin access required" });
    return;
  }
  next();
}

/** Require minimum role rank (user or admin token) */
export function requireRole(minRole: AppRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = req.accountType === "admin" ? req.admin?.role : req.user?.role;
    if (!role) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    if (!hasMinRole(role, minRole)) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const authenticate = authMiddleware;
export const requireAdmin = adminMiddleware;

export function signToken(
  accountId: string,
  role: string,
  email: string | undefined,
  accountType: AccountType
): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ userId: accountId, email: email ?? "", role, accountType }, secret, options);
}
