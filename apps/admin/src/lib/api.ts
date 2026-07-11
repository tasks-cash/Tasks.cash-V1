import { API_URL } from "@/config/env";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tc_admin_token");
}

/** Browser → same-origin BFF; server → Express API. */
function getAdminApiBase(): string {
  if (typeof window !== "undefined") return "";
  return API_URL;
}

export async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number; saved?: number }> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${getAdminApiBase()}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });

    const body = await res.json().catch(() => ({
      success: false,
      error: `Invalid API response (${res.status})`,
    }));

    if (!res.ok) {
      return {
        success: false,
        error: body.error ?? `Request failed (${res.status})`,
        status: res.status,
        data: body.data,
      };
    }

    return { ...body, status: res.status };
  } catch (err) {
    console.error("[adminFetch]", url, err);
    return { success: false, error: "Network error — is the API running?" };
  }
}
