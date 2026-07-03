"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EXPLORER_DNA_URL } from "@/config/routes";
import { Navbar, CoinBadge, Badge, PageTransition, DashboardSidebar, GameButton } from "@tasks-cash/ui";
import { MysteryChallengesButton } from "@/components/mystery/MysteryChallengesButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useT, useLocale } from "@/i18n/I18nProvider";
import { withLocalePrefix } from "@/i18n/locale-path";
import { apiFetch, clearToken, logoutSession } from "@/lib/api";
import { verifySession } from "@/lib/auth/verify-session";

const NAV_LINKS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "◈" },
  { href: "/dashboard/missions", label: "Missions", icon: "📜" },
  { href: "/dashboard/missions/submit", label: "Submit Proof", icon: "📋" },
  { href: "/dashboard/rewards", labelKey: "nav.rewards", icon: "🎁" },
  { href: "/dashboard/wallet", labelKey: "nav.wallet", icon: "💰" },
  { href: "/dashboard/withdrawals", label: "Withdrawals", icon: "◈" },
  { href: "/dashboard/referrals", labelKey: "nav.referrals", icon: "🔗" },
  { href: EXPLORER_DNA_URL, labelKey: "nav.explorerDna", icon: "🧬", badgeKey: "dna" as const },
  { href: "/dashboard/level", label: "Level", icon: "⚡" },
  { href: "/dashboard/leaderboard", label: "Rank", icon: "🏆" },
  { href: "/dashboard/notifications", label: "Alerts", icon: "🔔" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/security", label: "Security", icon: "🛡️" },
  { href: "/dashboard/support", label: "Support", icon: "💬" },
] as const;

type SessionState = "loading" | "authenticated" | "error";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useT();
  const [coins, setCoins] = useState(0);
  const [username, setUsername] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [dnaPending, setDnaPending] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [sessionError, setSessionError] = useState("");

  const loadSession = useCallback(async () => {
    setSessionState("loading");
    setSessionError("");

    const result = await verifySession();

    if (result.status === "unauthorized") {
      clearToken();
      router.replace(withLocalePrefix("/login", locale));
      return;
    }

    if (result.status === "error") {
      setSessionError(result.error);
      setSessionState("error");
      return;
    }

    setCoins(result.user.coins ?? 0);
    setUsername(result.user.username ?? "");
    localStorage.setItem("tc_user", JSON.stringify(result.user));
    setSessionState("authenticated");

    apiFetch<{ count: number }>("/api/notifications/unread-count").then((res) => {
      if (res.success && res.data) setUnreadCount(res.data.count);
    });
    apiFetch<{ profile: { pendingQuestions: number } }>("/api/explorer-dna/me").then((res) => {
      if (res.success && res.data?.profile) setDnaPending(res.data.profile.pendingQuestions);
    });
  }, [router, locale]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const sidebarItems = NAV_LINKS.map((item) => ({
    href: item.href.startsWith("http") ? item.href : withLocalePrefix(item.href, locale),
    label: "labelKey" in item ? t(item.labelKey) : ("label" in item ? item.label : ""),
    icon: item.icon,
    badge: "badgeKey" in item && item.badgeKey === "dna" ? dnaPending : undefined,
  }));

  if (sessionState === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-purple-400/60 text-sm gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-500 border-t-amber-400" />
        <p>Verifying session…</p>
      </div>
    );
  }

  if (sessionState === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 text-center gap-4">
        <p className="text-lg font-semibold text-white">Unable to verify session</p>
        <p className="text-sm text-purple-400/60 max-w-md">{sessionError}</p>
        <div className="flex flex-wrap gap-3 justify-center pt-2">
          <GameButton variant="gold" onClick={() => void loadSession()}>
            Retry
          </GameButton>
          <GameButton
            variant="secondary"
            onClick={() => {
              void logoutSession();
              router.replace(withLocalePrefix("/login", locale));
            }}
          >
            Go to Login
          </GameButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full bg-black">
      <DashboardSidebar
        items={sidebarItems}
        pathname={pathname}
        subtitle="Explorer Command Center"
        onLogout={() => {
          void logoutSession();
          clearToken();
          router.replace("/login");
        }}
      />
      <div className="flex-1 min-w-0">
        <Navbar
          links={[]}
          rightSlot={
            <div className="flex items-center gap-2 md:gap-3">
              <LanguageSwitcher className="hidden sm:flex" />
              <MysteryChallengesButton />
              <Link href={withLocalePrefix("/dashboard/notifications", locale)} className="relative hover-sound-ready" data-sound="notification">
                🔔
                {unreadCount > 0 && <Badge variant="gold" className="absolute -top-2 -right-3">{unreadCount}</Badge>}
              </Link>
              <CoinBadge amount={coins} size="sm" />
              <span className="hidden sm:block text-sm text-purple-300">{username}</span>
            </div>
          }
        />
        <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
