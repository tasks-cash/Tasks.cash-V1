/** Protected routes only — hub and arena pages stay public */

export const PROTECTED_PREFIXES = ["/admin", "/video-hunter", "/explorer-dna", "/profile", "/settings"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
