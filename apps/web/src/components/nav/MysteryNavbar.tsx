"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo } from "@tasks-cash/ui";
import { MAIN_APP_DASHBOARD_URL, EXPLORER_DNA_URL } from "@/lib/constants";
import { apiFetch, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const BASE_MYSTERY_NAV_LINKS = [
  { href: EXPLORER_DNA_URL, label: "Explorer DNA", external: true, badgeKey: "dna" as const },
  { href: "/challenges-arena", label: "Hub", badge: 0 },
  { href: "/video-hunter", label: "Video Hunter", badge: 2 },
  { href: "/raid-arena", label: "Raid Arena", badge: 1 },
  { href: "/duel-arena", label: "Duel Arena", badge: 0 },
  { href: "/mystery-vault", label: "Mystery Vault", badge: 1 },
  { href: "/leaderboards", label: "Leaderboards", badge: 0 },
  { href: "/rewards", label: "Rewards", badge: 3 },
  { href: "/progression", label: "Progression", badge: 0 },
] as const;

const ARENA_HREF = "/challenges-arena";

function isLinkActive(pathname: string, href: string) {
  if (href === "/challenges-arena") return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isArenaActive(pathname: string) {
  return pathname === ARENA_HREF || pathname === "/mystery-challenges" || pathname.startsWith(`${ARENA_HREF}/`);
}

interface MysteryNavbarProps {
  subNav?: React.ReactNode;
  className?: string;
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-red-400/60 bg-red-600 px-1 text-[9px] font-black leading-none text-white shadow-[0_0_10px_rgba(239,68,68,0.65)]"
      aria-label={`${count} notifications`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

function NavLinkItem({
  href,
  label,
  badge,
  active,
  external,
  onClick,
  className,
}: {
  href: string;
  label: string;
  badge: number;
  active: boolean;
  external?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <motion.span
        className={cn(
          "relative z-10 block text-[11px] font-bold uppercase tracking-[0.14em] transition-colors duration-200",
          active ? "text-amber-200" : "text-purple-300/55 group-hover:text-purple-100"
        )}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        {label}
      </motion.span>

      <NotificationBadge count={badge} />

      {active && (
        <motion.span
          layoutId="mystery-nav-active-glow"
          className="absolute inset-x-1 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-violet-500 via-amber-400 to-violet-500 shadow-[0_0_14px_rgba(212,175,55,0.75)]"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}

      <span
        className={cn(
          "pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          "bg-gradient-to-b from-purple-500/10 to-transparent"
        )}
        aria-hidden
      />
    </>
  );

  if (external) {
    return (
      <a href={href} onClick={onClick} className={cn("group relative px-3 py-2", className)}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={cn("group relative px-3 py-2", className)}>
      {content}
    </Link>
  );
}

export function MysteryNavbar({ subNav, className }: MysteryNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dnaPending, setDnaPending] = useState(3);
  const arenaActive = isArenaActive(pathname);

  useEffect(() => {
    if (!getToken()) return;
    apiFetch<{ profile: { pendingQuestions: number } }>("/api/explorer-dna/me").then((res) => {
      if (res.success && res.data?.profile) setDnaPending(res.data.profile.pendingQuestions);
    });
  }, [pathname]);

  const navLinks = BASE_MYSTERY_NAV_LINKS.map((link) => ({
    href: link.href,
    label: link.label,
    external: "external" in link && link.external,
    badge: "badgeKey" in link && link.badgeKey === "dna" ? dnaPending : ("badge" in link ? link.badge : 0),
  }));

  return (
    <header className={cn("mystery-navbar sticky top-0 z-50 w-full", className)}>
      <div className="relative border-b border-purple-500/20 bg-black/55 backdrop-blur-2xl">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-purple-950/30 via-transparent to-amber-950/20"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/25 to-transparent"
          aria-hidden
        />

        <div className="relative mx-auto flex w-full max-w-[100vw] items-center gap-3 px-4 py-3 md:px-6 lg:px-8 xl:px-10">
          <div className="flex shrink-0 items-center gap-3">
            <BrandLogo size="sm" href="/" animated={false} />
            <a
              href={MAIN_APP_DASHBOARD_URL}
              className="hidden sm:inline-flex text-[9px] font-semibold uppercase tracking-[0.18em] text-purple-400/40 hover:text-purple-200/80 transition-colors"
            >
              ← Dashboard
            </a>
          </div>

          <nav className="hidden xl:flex flex-1 items-center justify-center gap-0.5 min-w-0" aria-label="Mystery Challenges">
            {navLinks.map((link) => (
              <NavLinkItem
                key={link.href}
                href={link.href}
                label={link.label}
                badge={link.badge}
                active={!link.external && isLinkActive(pathname, link.href)}
                external={link.external}
              />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={MAIN_APP_DASHBOARD_URL}
              className="sm:hidden text-[9px] font-semibold uppercase tracking-[0.15em] text-purple-400/45 hover:text-purple-200 transition-colors"
            >
              Dashboard
            </a>

            <Link href={ARENA_HREF} className="hidden md:inline-flex">
              <motion.span
                className={cn(
                  "relative inline-flex items-center justify-center overflow-hidden rounded-xl px-4 py-2.5",
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  "border border-amber-400/45 bg-gradient-to-r from-amber-600/90 via-yellow-500/90 to-amber-500/90 text-black",
                  "shadow-[0_0_24px_rgba(212,175,55,0.35)]",
                  arenaActive && "ring-2 ring-amber-300/50"
                )}
                whileHover={{ scale: 1.03, boxShadow: "0 0 32px rgba(212,175,55,0.55)" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 24 }}
              >
                <span className="relative z-10">Enter Arena</span>
                <motion.span
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  animate={{ x: ["-120%", "120%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
                  aria-hidden
                />
              </motion.span>
            </Link>

            <button
              type="button"
              className="xl:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-950/40 text-purple-200 hover:border-purple-400/40 transition-colors"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="sr-only">Menu</span>
              <div className="flex flex-col gap-1.5">
                <span className={cn("block h-0.5 w-5 bg-current transition-transform", mobileOpen && "translate-y-2 rotate-45")} />
                <span className={cn("block h-0.5 w-5 bg-current transition-opacity", mobileOpen && "opacity-0")} />
                <span className={cn("block h-0.5 w-5 bg-current transition-transform", mobileOpen && "-translate-y-2 -rotate-45")} />
              </div>
            </button>
          </div>
        </div>

        {subNav && (
          <div className="relative border-t border-purple-500/10 px-4 pb-3 pt-3 md:px-6 lg:px-8 xl:px-10">
            {subNav}
          </div>
        )}
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm xl:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close menu overlay"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              className="fixed inset-x-0 top-[var(--mystery-nav-height,64px)] z-50 max-h-[calc(100dvh-var(--mystery-nav-height,64px))] overflow-y-auto border-b border-purple-500/20 bg-black/90 backdrop-blur-2xl xl:hidden"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <nav className="flex flex-col gap-1 p-4 md:p-6" aria-label="Mobile Mystery Challenges">
                {navLinks.map((link) => (
                  <NavLinkItem
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    badge={link.badge}
                    active={!link.external && isLinkActive(pathname, link.href)}
                    external={link.external}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-transparent hover:border-purple-500/20 hover:bg-purple-950/30 px-4 py-3"
                  />
                ))}

                <Link
                  href={ARENA_HREF}
                  onClick={() => setMobileOpen(false)}
                  className="mt-3"
                >
                  <motion.span
                    className={cn(
                      "flex w-full items-center justify-center rounded-xl px-4 py-3.5",
                      "text-[11px] font-black uppercase tracking-[0.2em]",
                      "border border-amber-400/45 bg-gradient-to-r from-amber-600 to-yellow-500 text-black",
                      "shadow-[0_0_20px_rgba(212,175,55,0.35)]"
                    )}
                    whileTap={{ scale: 0.98 }}
                  >
                    Enter Arena
                  </motion.span>
                </Link>

                <a
                  href={MAIN_APP_DASHBOARD_URL}
                  className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-400/50 hover:text-purple-200 py-2"
                >
                  ← Back to Dashboard
                </a>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
