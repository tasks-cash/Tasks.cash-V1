import { jwtVerify, type JWTPayload } from "jose";
import jwt from "jsonwebtoken";
// export interface TokenPayload extends JWTPayload {
//   userId: string;
//   email?: string;
//   role: string;
// }


export interface TokenPayload {
  userId: string;
  // email?: string;
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
    const payload = jwt.verify(token, getSecret()) as TokenPayload;

    if (!payload.userId || typeof payload.userId !== "string") return null;
    return payload;
  } catch (error) {
    console.error("[JWT VERIFY ERROR]", error);
    return null;
  }
}

export function getBearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export interface TokenPayload {
  userId: string;
  email?: string;
  role: string;
  iat?: number;
  exp?: number;
}


