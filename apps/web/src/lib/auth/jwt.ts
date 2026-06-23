/** JWT helpers — use Express API for auth; these are structure placeholders for future Next.js auth */
export interface JwtPayload {
  userId: string;
  role: string;
}

export function getBearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}
