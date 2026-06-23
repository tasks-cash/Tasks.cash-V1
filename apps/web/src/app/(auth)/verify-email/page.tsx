"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { apiFetch, setToken } from "@/lib/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const endpoint = "/api/auth/verify-email";
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
      router.push("/dashboard");
      return;
    }
    setError(res.error ?? "Something went wrong");
  }

  return (
    <AuthLayout title="Verify Your Email" subtitle="Confirm your identity to enter the portal">
      <p className="text-purple-200/60 text-sm text-center mb-4">Enter the 6-digit code sent to your email.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label htmlFor="code">Verification Code</Label><Input id="code" name="code" required className="mt-1 auth-input text-center tracking-[0.5em] text-lg" placeholder="000000" maxLength={6} /></div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <PortalButton variant="gold" className="w-full" disabled={loading} pulse data-sound="verify">{loading ? "Verifying..." : "Enter The Portal"}</PortalButton>
      </form>
    </AuthLayout>
  );
}
