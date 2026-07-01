const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Browser calls same-origin Next.js routes; server calls Express API directly. */
export function getApiBase(): string {
  if (typeof window !== "undefined") return "";
  return API_URL;
}

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tc_token");
}

export function setToken(token: string): void {
  localStorage.setItem("tc_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("tc_token");
  localStorage.removeItem("tc_user");
}

/** Clear client session and httpOnly cookie */
export async function logoutSession(): Promise<void> {
  clearToken();
  try {
    await fetch(`${getApiBase()}/api/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    /* cookie clear is best-effort when offline */
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${getApiBase()}${path}`, { ...options, headers, credentials: "include" });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
    return data as ApiResult<T>;
  } catch {
    return { success: false, error: "Network error — is the API running?" };
  }
}

export { API_URL };
