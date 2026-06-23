"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { apiFetch, setToken } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const endpoint = "/api/auth/forgot-password";
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
      router.push("/reset-password");
      return;
    }
    setError(res.error ?? "Something went wrong");
  }

  return (
    <AuthLayout title="Reset Portal Key" subtitle="We'll send a recovery link to your email">
      <p className="text-center text-sm mb-6"><Link href="/login" className="text-purple-400 hover:underline">Back to login</Link></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="mt-1 auth-input" placeholder="warrior@portal.io" /></div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <PortalButton variant="gold" className="w-full" disabled={loading} data-sound="reset">{loading ? "Sending..." : "Send Recovery Link"}</PortalButton>
      </form>
    </AuthLayout>
  );
}
