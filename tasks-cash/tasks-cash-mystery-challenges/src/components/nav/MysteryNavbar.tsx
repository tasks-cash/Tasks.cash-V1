"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { mainRoutes } from "@/config/routes";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { stripLocalePrefix, withLocalePrefix } from "@/i18n/locale-path";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", labelKey: "challengeNav.hub" },
  { href: "/video-hunter", labelKey: "challengeNav.videoHunter" },
  { href: "/referral-arena", labelKey: "challengeNav.referralArena" },
  { href: "/identity-challenge", labelKey: "challengeNav.identityChallenge" },
  { href: "/special-missions", labelKey: "challengeNav.specialMissions" },
  { href: "/raid-arena", labelKey: "challengeNav.raidArena" },
  { href: "/duel-arena", labelKey: "challengeNav.duelArena" },
  { href: "/mystery-vault", labelKey: "challengeNav.mysteryVault" },
  { href: "/leaderboards", labelKey: "challengeNav.leaderboards" },
  { href: "/rewards", labelKey: "challengeNav.rewards" },
  { href: "/explorer-dna", labelKey: "challengeNav.explorerDna" },
] as const;

function isActive(pathname: string, href: string) {
  const { pathname: bare } = stripLocalePrefix(pathname);
  const target = href === "/" ? "/" : href;
  if (target === "/") return bare === "/";
  return bare === target || bare.startsWith(`${target}/`);
}

export function MysteryNavbar() {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const t = useT();
  const [open, setOpen] = useState(false);
  const main = mainRoutes(locale);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-500/15 bg-black/60 backdrop-blur-2xl">
      <div className="flex w-full items-center justify-between gap-3 px-[clamp(1rem,4vw,3rem)] py-3">
        <Link href={withLocalePrefix("/", locale)} className="flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/main_logo.png" alt="Tasks.cash" className="h-8 md:h-10 w-auto object-contain" draggable={false} />
          <span className="hidden sm:block text-[10px] uppercase tracking-[0.3em] text-purple-400/60 font-semibold">
            {t("common.mysteryChallenges")}
          </span>
        </Link>

        <nav className="hidden xl:flex flex-1 items-center justify-center gap-1 flex-wrap">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={withLocalePrefix(link.href, locale)}
              className={cn(
                "rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                isActive(pathname, link.href)
                  ? "text-amber-200 bg-purple-950/50 border border-amber-400/30"
                  : "text-purple-400/60 hover:text-purple-100"
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher className="hidden" />
          <a
            href={main.dashboard}
            className="hidden sm:inline text-[10px] uppercase tracking-wider text-purple-400/50 hover:text-purple-200"
          >
            {t("common.dashboard")}
          </a>
          <button
            type="button"
            className="xl:hidden rounded-lg border border-purple-500/25 px-3 py-2 text-xs text-purple-200"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {t("common.menu")}
          </button>
        </div>
      </div>

      {open && (
        <nav className="xl:hidden border-t border-purple-500/10 px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
          <LanguageSwitcher className="mb-2 md:hidden w-full justify-center" />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={withLocalePrefix(link.href, locale)}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider",
                isActive(pathname, link.href) ? "text-amber-200 bg-purple-950/40" : "text-purple-300/70"
              )}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <a href={main.dashboard} className="mt-2 text-center text-[10px] uppercase tracking-wider text-purple-400/50 py-2">
            ← {t("common.dashboard")}
          </a>
        </nav>
      )}
    </header>
  );
}
