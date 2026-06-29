"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { apiFetch, setToken } from "@/lib/api";
import {
  clearStoredReferralCode,
  getStoredReferralCode,
  saveReferralCode,
} from "@/lib/referral-storage";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralLocked, setReferralLocked] = useState(false);
  const [noInviteCode, setNoInviteCode] = useState(false);
  const [referralError, setReferralError] = useState("");

  useEffect(() => {
    const refFromUrl = searchParams.get("ref")?.trim();
    const stored = getStoredReferralCode();
    const initial = (refFromUrl || stored || "").toUpperCase();

    if (initial) {
      setReferralCode(initial);
      saveReferralCode(initial);
      if (refFromUrl) setReferralLocked(true);
    }
  }, [searchParams]);

  async function validateReferralCode(code: string) {
    if (!code.trim()) return true;
    const res = await apiFetch<{ valid: boolean; error?: string }>("/api/referrals/validate-code", {
      method: "POST",
      body: JSON.stringify({ code: code.trim() }),
    });
    if (!res.success || !res.data?.valid) {
      setReferralError(res.data?.error ?? res.error ?? "Invalid referral code");
      return false;
    }
    setReferralError("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setReferralError("");

    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries()) as Record<string, string>;
    const code = noInviteCode ? "" : referralCode.trim().toUpperCase();

    if (code) {
      const valid = await validateReferralCode(code);
      if (!valid) {
        setLoading(false);
        return;
      }
      body.referralCode = code;
    }

    const res = await apiFetch<{ accessToken?: string; user?: Record<string, unknown> }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.success && res.data?.accessToken) {
      clearStoredReferralCode();
      setToken(res.data.accessToken);
      if (res.data.user) localStorage.setItem("tc_user", JSON.stringify(res.data.user));
      router.push("/dashboard");
      return;
    }

    setError(res.error ?? "Something went wrong");
  }

  return (
    <AuthLayout title="Enter the Portal" subtitle="Create your explorer account and claim founder status">
      <p className="text-center text-sm text-purple-400/60 mb-6">
        Already a warrior?{" "}
        <Link href="/login" className="text-amber-400 hover:underline">
          Login
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" required className="mt-1 auth-input" placeholder="VoidRunner" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required className="mt-1 auth-input" placeholder="warrior@portal.io" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required className="mt-1 auth-input" placeholder="••••••••" />
        </div>

        <div>
          <Label htmlFor="referralCode">Who invited you? / Invite code</Label>
          <Input
            id="referralCode"
            name="referralCodeDisplay"
            value={noInviteCode ? "" : referralCode}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setReferralCode(value);
              if (value) saveReferralCode(value);
            }}
            readOnly={referralLocked && !noInviteCode}
            disabled={noInviteCode}
            className="mt-1 auth-input uppercase tracking-wider"
            placeholder="VOID-7X9K"
          />
          <p className="text-xs text-purple-400/50 mt-2">
            Invite codes may unlock bonuses and referral rewards.
          </p>
          {referralError && <p className="text-red-400 text-sm mt-2">{referralError}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm text-purple-300/70 cursor-pointer">
          <input
            type="checkbox"
            checked={noInviteCode}
            onChange={(e) => {
              setNoInviteCode(e.target.checked);
              if (e.target.checked) setReferralError("");
            }}
            className="rounded border-purple-500/40 bg-black/40"
          />
          I do not have an invite code
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <PortalButton variant="gold" className="w-full" disabled={loading} pulse data-sound="register">
          {loading ? "Creating Account..." : "Create Account"}
        </PortalButton>
        <PortalButton variant="secondary" className="w-full" type="button" onClick={() => router.push("/")} data-sound="explore">
          Explore Worlds First
        </PortalButton>
      </form>
    </AuthLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Enter the Portal" subtitle="Loading registration portal...">
          <p className="text-center text-purple-300/60">Preparing your invite link...</p>
        </AuthLayout>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
