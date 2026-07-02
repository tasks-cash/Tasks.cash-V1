import { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { User, IUserDocument } from "../models/User";
import { isDbConnected } from "../config/database";

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

interface JwtPayload {
  userId: string;
  email?: string;
  role: string;
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

/** Verify JWT and attach user to request */
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

    if (!isDbConnected()) {
      res.status(503).json({ success: false, error: "Database unavailable" });
      return;
    }

    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user) {
      res.status(401).json({ success: false, error: "User not found" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
}

/** Require admin-level role */
export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !hasMinRole(req.user.role, "admin")) {
    res.status(403).json({ success: false, error: "Admin access required" });
    return;
  }
  next();
}

/** Require minimum role rank */
export function requireRole(minRole: AppRole) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    if (!hasMinRole(req.user.role, minRole)) {
      res.status(403).json({ success: false, error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

export const authenticate = authMiddleware;
export const requireAdmin = adminMiddleware;

export function signToken(userId: string, role: string, email?: string): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, email: email ?? "", role }, secret, options);
}
