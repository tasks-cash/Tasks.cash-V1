"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { apiFetch, setToken } from "@/lib/api";
import { buildPostLoginRedirect, getSafeRedirectUrl, shouldPreserveRedirectParam } from "@/lib/auth/redirect";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { withLocalePrefix } from "@/i18n/locale-path";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useT();
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

      const next = buildPostLoginRedirect(rawRedirect, res.data.accessToken);
      if (next.startsWith("http")) {
        window.location.href = next;
        return;
      }
      router.push(withLocalePrefix(next, locale));
      return;
    }

    setError(res.error ?? "Invalid credentials");
  }

  const registerHref = shouldPreserveRedirectParam(rawRedirect)
    ? `${withLocalePrefix("/register", locale)}?redirect=${encodeURIComponent(getSafeRedirectUrl(rawRedirect))}`
    : withLocalePrefix("/register", locale);

  return (
    <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <div className="flex justify-center mb-4">
        <LanguageSwitcher />
      </div>
      <p className="text-center text-sm text-purple-400/60 mb-6">
        {t("auth.noAccount")}{" "}
        <Link href={registerHref} className="text-amber-400 hover:underline">
          {t("auth.createAccount")}
        </Link>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input id="email" name="email" type="email" required className="mt-1 auth-input" placeholder="warrior@portal.io" />
        </div>
        <div>
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input id="password" name="password" type="password" required className="mt-1 auth-input" placeholder="••••••••" />
        </div>
        <p className="text-center text-sm">
          <Link href={withLocalePrefix("/forgot-password", locale)} className="text-purple-400 hover:underline">
            {t("auth.forgotPassword")}
          </Link>
        </p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <PortalButton variant="gold" className="w-full" disabled={loading} pulse data-sound="login">
          {loading ? t("auth.openingPortal") : t("auth.enterPortal")}
        </PortalButton>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  const t = useT();

  return (
    <Suspense
      fallback={
        <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
          <p className="text-center text-purple-300/60">{t("common.loading")}</p>
        </AuthLayout>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
