export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** User-facing API calls — accepts dashboard token or admin token */
export function getUserToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tc_token") ?? localStorage.getItem("tc_admin_token");
}

export async function userApiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  const token = getUserToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({ success: false, error: "Invalid response" }));
    return data as ApiResult<T>;
  } catch {
    return { success: false, error: "Network error — is the API running?" };
  }
}
