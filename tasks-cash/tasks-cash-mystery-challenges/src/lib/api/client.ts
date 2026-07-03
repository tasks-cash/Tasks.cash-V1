export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(path, { ...options, headers, credentials: "include" });
    const json = (await res.json().catch(() => ({}))) as ApiResult<T> & { message?: string };

    if (!res.ok) {
      return { success: false, error: json.error ?? json.message ?? `Request failed (${res.status})` };
    }

    return json;
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function apiFormFetch<T>(path: string, formData: FormData): Promise<ApiResult<T>> {
  return apiFetch<T>(path, { method: "POST", body: formData });
}
