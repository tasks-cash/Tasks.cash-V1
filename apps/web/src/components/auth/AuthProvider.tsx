"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, getToken, logoutSession, setToken } from "@/lib/api";
import type { AppRole } from "@/lib/auth/config";
import { hasMinRole, normalizeRole } from "@/lib/auth/config";
import { buildPostLoginRedirect } from "@/lib/auth/redirect";

export interface AuthUser {
  _id: string;
  username?: string;
  email?: string;
  role: AppRole;
  coins?: number;
  xp?: number;
  level?: number;
  referralCode?: string;
  badges?: string[];
  currencies?: Record<string, number>;
  rpgStats?: Record<string, number>;
}

interface AuthContextValue {
  user: AuthUser | null;
  userId: string | null;
  role: AppRole;
  loading: boolean;
  isAuthenticated: boolean;
  notificationCount: number;
  wallet: { coins: number };
  xp: number;
  hasRole: (minRole: AppRole) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function syncSessionCookie(token: string): Promise<void> {
  await fetch("/api/auth/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token }),
  });
}

async function loadCurrentUser(): Promise<AuthUser | null> {
  const me = await apiFetch<AuthUser>("/api/auth/me");
  if (me.success && me.data) {
    const normalized = { ...me.data, role: normalizeRole(me.data.role) };
    localStorage.setItem("tc_user", JSON.stringify(normalized));
    return normalized;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (token) {
      await syncSessionCookie(token);
    }

    const current = await loadCurrentUser();
    if (current) {
      setUser(current);
    } else {
      setUser(null);
      setNotificationCount(0);
      return;
    }

    const notes = await apiFetch<{ count: number }>("/api/notifications/unread-count");
    if (notes.success && notes.data) setNotificationCount(notes.data.count);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      const current = await loadCurrentUser();
      if (current) {
        setUser(current);
        const token = getToken();
        if (token) await syncSessionCookie(token);
        const notes = await apiFetch<{ count: number }>("/api/notifications/unread-count");
        if (notes.success && notes.data) setNotificationCount(notes.data.count);
      }
      setLoading(false);
    }
    void bootstrap();
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setUser(null);
    setNotificationCount(0);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: user?._id ?? null,
      role: user?.role ?? "guest",
      loading,
      isAuthenticated: Boolean(user),
      notificationCount,
      wallet: { coins: user?.coins ?? 0 },
      xp: user?.xp ?? 0,
      hasRole: (minRole) => hasMinRole(user?.role, minRole),
      refreshUser,
      logout,
    }),
    [user, loading, notificationCount, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

/** Sync localStorage token to cookie on login pages — never loop through auth routes */
export function useAuthSessionRecovery(redirectParam?: string | null) {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    void (async () => {
      try {
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        if (!res.ok) return;

        const next = buildPostLoginRedirect(redirectParam, token);
        const pathOnly = next.startsWith("http") ? new URL(next).pathname : next.split("?")[0];
        if (pathOnly === "/login" || pathOnly === "/register" || pathOnly.startsWith("/forgot-password")) {
          return;
        }

        window.location.href = next;
      } catch {
        /* stay on login — avoid redirect loops when sync fails */
      }
    })();
  }, [redirectParam]);
}

export { setToken };
