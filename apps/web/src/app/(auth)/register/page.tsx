"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { apiFetch, setToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const endpoint = "/api/auth/register";
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
    <AuthLayout title="Enter the Portal" subtitle="Create your explorer account and claim founder status">
      <p className="text-center text-sm text-purple-400/60 mb-6">Already a warrior? <Link href="/login" className="text-amber-400 hover:underline">Login</Link></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><Label htmlFor="username">Username</Label><Input id="username" name="username" required className="mt-1 auth-input" placeholder="VoidRunner" /></div>
        <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="mt-1 auth-input" placeholder="warrior@portal.io" /></div>
        <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required className="mt-1 auth-input" placeholder="••••••••" /></div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <PortalButton variant="gold" className="w-full" disabled={loading} pulse data-sound="register">{loading ? "Creating Account..." : "Create Account"}</PortalButton>
        <PortalButton variant="secondary" className="w-full" type="button" onClick={() => router.push("/")} data-sound="explore">Explore Worlds First</PortalButton>
      </form>
    </AuthLayout>
  );
}
