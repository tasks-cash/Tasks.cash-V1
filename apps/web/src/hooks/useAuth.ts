"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearToken } from "@/lib/api";

interface AuthUser {
  username?: string;
  coins?: number;
  role?: string;
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const stored = localStorage.getItem("tc_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    router.push("/");
  }, [router]);

  return { user, loading, isAuthenticated: !!getToken(), logout };
}
