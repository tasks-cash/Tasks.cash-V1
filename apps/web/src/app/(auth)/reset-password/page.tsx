"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { apiFetch, setToken } from "@/lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const endpoint = "/api/auth/reset-password";
    const res = await apiFetch<{ accessToken?: string; user?: Record<string, unknown> }>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.success && res.data?.accessToken) {
      setToken(res.data.accessToken);
      if (res.data.user) localStorage.setItem("tc_user", JSON.stringify(res.data.user));
      router.push("/dashboard");
      return;
    }
    if (res.success) {
      router.push("/login");
      return;
    }
    setError(res.error ?? "Something went wrong");
  }

  return (
    <AuthLayout title="New Portal Key" subtitle="Choose a strong password for your portal access">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label htmlFor="password">New Password</Label><Input id="password" name="password" type="password" required className="mt-1 auth-input" placeholder="••••••••" /></div>
        <div><Label htmlFor="confirm">Confirm Password</Label><Input id="confirm" name="confirm" type="password" required className="mt-1 auth-input" placeholder="••••••••" /></div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <PortalButton variant="gold" className="w-full" disabled={loading} pulse data-sound="reset-password">{loading ? "Updating..." : "Reset Password"}</PortalButton>
        <p className="text-center text-sm"><Link href="/login" className="text-purple-400 hover:underline">Back to login</Link></p>
      </form>
    </AuthLayout>
  );
}
