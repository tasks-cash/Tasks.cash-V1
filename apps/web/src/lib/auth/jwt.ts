import { jwtVerify, type JWTPayload } from "jose";

export interface TokenPayload extends JWTPayload {
  userId: string;
  email?: string;
  role: string;
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret");
}

/** Edge-safe JWT verification for middleware and API routes */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.userId || typeof payload.userId !== "string") return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export function getBearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}
