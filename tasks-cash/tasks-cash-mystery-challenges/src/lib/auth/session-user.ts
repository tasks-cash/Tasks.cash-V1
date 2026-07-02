import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
}

export interface SessionUser {
  userId: string;
  email?: string;
  role?: string;
}

export async function getTokenFromRequest(request: Request): Promise<string | null> {
  const header = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (header) return header;

  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getSessionUser(request: Request): Promise<SessionUser | null> {
  const token = await getTokenFromRequest(request);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const userId = payload.userId;
    if (typeof userId !== "string" || !userId) return null;
    return {
      userId,
      email: typeof payload.email === "string" ? payload.email : undefined,
      role: typeof payload.role === "string" ? payload.role : undefined,
    };
  } catch {
    return null;
  }
}
