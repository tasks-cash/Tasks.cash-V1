"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo, PortalButton, GlassCard, ParticleField } from "@tasks-cash/ui";
import { hasMinRole } from "@/lib/auth/config";
import { API_URL } from "@/config/env";

type AdminLoginDebug = {
  userFound?: boolean;
  passwordFieldExists?: boolean;
  passwordValid?: boolean;
  roleAllowed?: boolean;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@tasks.cash");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tc-Admin-Login-Debug": "1" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        debug?: AdminLoginDebug;
        data?: { accessToken?: string; admin?: { role?: string } };
      };

      const debug = data.debug ?? {};
      const userFound = debug.userFound ?? Boolean(data.data?.admin);
      const passwordFieldExists = debug.passwordFieldExists ?? userFound;
      const passwordValid = debug.passwordValid ?? Boolean(data.success);
      const roleAllowed =
        debug.roleAllowed ??
        Boolean(data.data?.admin?.role && hasMinRole(data.data.admin.role, "admin"));

      console.log("[AdminLogin] user found:", userFound);
      console.log("[AdminLogin] password field exists:", passwordFieldExists);
      console.log("[AdminLogin] password valid:", passwordValid);
      console.log("[AdminLogin] role allowed:", roleAllowed);

      if (data.success && data.data?.accessToken && data.data.admin?.role && hasMinRole(data.data.admin.role, "admin")) {
        localStorage.setItem("tc_admin_token", data.data.accessToken);
        router.push("/dashboard");
      } else {
        setError(data.error ?? "Admin access denied");
      }
    } catch (err) {
      console.error("[AdminLogin] request failed:", err);
      setError("Login failed — please try again");
    }

    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 bg-black overflow-hidden">
      <ParticleField count={40} />
      <div className="portal-ring absolute h-80 w-80 opacity-15 animate-portal-spin" />
      <GlassCard glow="violet" className="relative z-10 w-full max-w-md p-8 md:p-10">
        <div className="text-center mb-8">
          <BrandLogo size="md" href="/" showTagline className="mx-auto" />
          <p className="text-amber-400/70 text-[10px] uppercase tracking-[0.3em] mt-4 font-semibold">Command Center Access</p>
          <p className="text-purple-300/60 text-sm mt-2">Admin authentication required</p>
        </div>
        <div className="portal-divider mb-6" />
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
            placeholder="admin@tasks.cash"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
            placeholder="••••••••"
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <PortalButton type="submit" variant="gold" size="lg" loading={loading} pulse className="w-full" data-sound="admin-login">
            Enter Command Center
          </PortalButton>
        </form>
      </GlassCard>
    </div>
  );
}
