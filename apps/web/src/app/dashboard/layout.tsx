"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EXPLORER_DNA_URL } from "@/lib/constants";
import { Navbar, CoinBadge, Badge, PageTransition, DashboardSidebar } from "@tasks-cash/ui";
import { MysteryChallengesButton } from "@/components/mystery/MysteryChallengesButton";
import { apiFetch, clearToken, logoutSession } from "@/lib/api";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview", icon: "◈" },
  { href: "/dashboard/missions", label: "Missions", icon: "📜" },
  { href: "/dashboard/missions/submit", label: "Submit Proof", icon: "📋" },
  { href: "/dashboard/rewards", label: "Rewards", icon: "🎁" },
  { href: "/dashboard/wallet", label: "Wallet", icon: "💰" },
  { href: "/dashboard/withdrawals", label: "Withdrawals", icon: "◈" },
  { href: "/dashboard/referrals", label: "Referrals", icon: "🔗" },
  { href: EXPLORER_DNA_URL, label: "Explorer DNA", icon: "🧬", badgeKey: "dna" as const },
  { href: "/dashboard/level", label: "Level", icon: "⚡" },
  { href: "/dashboard/leaderboard", label: "Rank", icon: "🏆" },
  { href: "/dashboard/notifications", label: "Alerts", icon: "🔔" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/security", label: "Security", icon: "🛡️" },
  { href: "/dashboard/support", label: "Support", icon: "💬" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [coins, setCoins] = useState(0);
  const [username, setUsername] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [dnaPending, setDnaPending] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function init() {
      const me = await apiFetch<{ username?: string; coins?: number }>("/api/auth/me");
      if (!me.success || !me.data) {
        router.replace("/login");
        return;
      }

      setCoins(me.data.coins ?? 0);
      setUsername(me.data.username ?? "");
      localStorage.setItem("tc_user", JSON.stringify(me.data));
      setAuthChecked(true);

      apiFetch<{ count: number }>("/api/notifications/unread-count").then((res) => {
        if (res.success && res.data) setUnreadCount(res.data.count);
      });
      apiFetch<{ profile: { pendingQuestions: number } }>("/api/explorer-dna/me").then((res) => {
        if (res.success && res.data?.profile) setDnaPending(res.data.profile.pendingQuestions);
      });
    }
    void init();
  }, [router, pathname]);

  const sidebarItems = NAV_LINKS.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
    badge: "badgeKey" in item && item.badgeKey === "dna" ? dnaPending : undefined,
  }));

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-purple-400/60 text-sm">
        Verifying session…
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
              <MysteryChallengesButton />
              <Link href="/dashboard/notifications" className="relative hover-sound-ready" data-sound="notification">
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
