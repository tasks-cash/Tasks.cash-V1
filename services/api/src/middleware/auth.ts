import { Request, Response, NextFunction } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { User, IUserDocument } from "../models/User";

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

interface JwtPayload {
  userId: string;
  role: string;
}

/** Verify JWT and attach user to request */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET ?? "dev-secret";

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
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

/** Require admin role */
export function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ success: false, error: "Admin access required" });
    return;
  }
  next();
}

export const authenticate = authMiddleware;
export const requireAdmin = adminMiddleware;

export function signToken(userId: string, role: string): string {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ userId, role }, secret, options);
}
