export const SESSION_VERIFY_TIMEOUT_MS = 8000;

export interface SessionUser {
  _id: string;
  username?: string;
  email?: string;
  role?: string;
  coins?: number;
  xp?: number;
  level?: number;
  referralCode?: string;
}

export type SessionVerifyResult =
  | { status: "ok"; user: SessionUser }
  | { status: "unauthorized" }
  | { status: "error"; error: string };

/** Verify session via same-origin /api/auth/me (cookie + optional Bearer). */
export async function verifySession(): Promise<SessionVerifyResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SESSION_VERIFY_TIMEOUT_MS);

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("tc_token") : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch("/api/auth/me", {
      method: "GET",
      headers,
      credentials: "include",
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({ success: false }))) as {
      success?: boolean;
      data?: SessionUser;
      error?: string;
    };

    if (res.status === 401) {
      return { status: "unauthorized" };
    }

    if (!res.ok || !data.success || !data.data) {
      return {
        status: "error",
        error: data.error ?? `Unable to verify session (${res.status})`,
      };
    }

    return { status: "ok", user: data.data };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { status: "error", error: "Session verification timed out" };
    }
    return { status: "error", error: "Network error — is the API running?" };
  } finally {
    clearTimeout(timeout);
  }
}
