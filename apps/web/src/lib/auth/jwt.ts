import { jwtVerify, type JWTPayload } from "jose";

export interface TokenPayload extends JWTPayload {
  userId: string;
  email?: string;
  role: string;
  accountType?: "user" | "admin";
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "dev-secret";
  if (!process.env.JWT_SECRET) {
    console.warn("[verifyAccessToken] JWT_SECRET missing — using dev-secret fallback");
  }
  return new TextEncoder().encode(secret);
}

function normalizeToken(token: string): string {
  return token.replace(/^Bearer\s+/i, "").trim();
}

/** Edge-safe JWT verification for middleware and API routes */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  const raw = normalizeToken(token);

  if (!raw.startsWith("eyJ")) {
    console.log("[verifyAccessToken] token does not start with eyJ", { prefix: raw.slice(0, 12) });
    return null;
  }

  try {
    const { payload } = await jwtVerify(raw, getSecret());

    if (!payload.userId || typeof payload.userId !== "string") {
      console.log("[verifyAccessToken] missing userId in payload", { keys: Object.keys(payload) });
      return null;
    }

    console.log("[verifyAccessToken] ok", { userId: payload.userId, role: payload.role });
    return payload as TokenPayload;
  } catch (error) {
    console.log("[verifyAccessToken] failed", error instanceof Error ? error.message : error);
    return null;
  }
}

export function getBearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return normalizeToken(header.slice(7));
}
