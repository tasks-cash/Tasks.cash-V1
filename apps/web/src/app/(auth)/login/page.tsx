"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { apiFetch, setToken } from "@/lib/api";
import { buildPostLoginRedirect, getSafeRedirectUrl, shouldPreserveRedirectParam } from "@/lib/auth/redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    const res = await apiFetch<{ accessToken?: string; user?: Record<string, unknown> }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (res.success && res.data?.accessToken) {
      setToken(res.data.accessToken);
      if (res.data.user) localStorage.setItem("tc_user", JSON.stringify(res.data.user));

      await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${res.data.accessToken}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token: res.data.accessToken }),
      });

      const next = buildPostLoginRedirect(rawRedirect, res.data.accessToken);
      if (next.startsWith("http")) {
        window.location.href = next;
        return;
      }
      router.push(next);
      return;
    }

    setError(res.error ?? "Invalid credentials");
  }

  const registerHref = shouldPreserveRedirectParam(rawRedirect)
    ? `/register?redirect=${encodeURIComponent(getSafeRedirectUrl(rawRedirect))}`
    : "/register";

  return (
    <AuthLayout title="Return to Portal" subtitle="Authenticate to enter your command center">
      <p className="text-center text-sm text-purple-400/60 mb-6">
        No account?{" "}
        <Link href={registerHref} className="text-amber-400 hover:underline">
          Create Account
        </Link>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="mt-1 auth-input" placeholder="warrior@portal.io" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required className="mt-1 auth-input" placeholder="••••••••" />
        </div>
        <p className="text-center text-sm">
          <Link href="/forgot-password" className="text-purple-400 hover:underline">
            Forgot password?
          </Link>
        </p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <PortalButton variant="gold" className="w-full" disabled={loading} pulse data-sound="login">
          {loading ? "Opening Portal..." : "Enter The Portal"}
        </PortalButton>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Return to Portal" subtitle="Loading login portal...">
          <p className="text-center text-purple-300/60">Preparing secure entry...</p>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
