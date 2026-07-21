import { jwtVerify } from "jose";

export interface TokenPayload {
  userId: string;
  email?: string;
  role: string;
  iat?: number;
  exp?: number;
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
}

/** Edge-safe JWT verification for middleware and API routes */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") return null;
    return {
      userId: payload.userId,
      role: payload.role,
      email: typeof payload.email === "string" ? payload.email : undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error("[JWT VERIFY ERROR]", error);
    return null;
  }
}

export function getBearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

