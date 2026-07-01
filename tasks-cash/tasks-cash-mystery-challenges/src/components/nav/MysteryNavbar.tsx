"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Hub" },
  { href: "/video-hunter", label: "Video Hunter" },
  { href: "/referral-arena", label: "Referral Arena" },
  { href: "/identity-challenge", label: "Identity" },
  { href: "/special-missions", label: "Missions" },
  { href: "/raid-arena", label: "Raid Arena" },
  { href: "/duel-arena", label: "Duel Arena" },
  { href: "/mystery-vault", label: "Mystery Vault" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/rewards", label: "Rewards" },
  { href: "/explorer-dna", label: "Explorer DNA" },
] as const;

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MysteryNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-500/15 bg-black/60 backdrop-blur-2xl">
      <div className="flex w-full items-center justify-between gap-3 px-[clamp(1rem,4vw,3rem)] py-3">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/image/main_logo.png" alt="Tasks.cash" className="h-8 md:h-10 w-auto object-contain" draggable={false} />
          <span className="hidden sm:block text-[10px] uppercase tracking-[0.3em] text-purple-400/60 font-semibold">
            Mystery Challenges
          </span>
        </Link>

        <nav className="hidden xl:flex flex-1 items-center justify-center gap-1 flex-wrap">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-2.5 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                isActive(pathname, link.href)
                  ? "text-amber-200 bg-purple-950/50 border border-amber-400/30"
                  : "text-purple-400/60 hover:text-purple-100"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={MAIN_APP_URL}
            className="hidden sm:inline text-[10px] uppercase tracking-wider text-purple-400/50 hover:text-purple-200"
          >
            Dashboard
          </a>
          <button
            type="button"
            className="xl:hidden rounded-lg border border-purple-500/25 px-3 py-2 text-xs text-purple-200"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>

      {open && (
        <nav className="xl:hidden border-t border-purple-500/10 px-4 py-3 flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider",
                isActive(pathname, link.href) ? "text-amber-200 bg-purple-950/40" : "text-purple-300/70"
              )}
            >
              {link.label}
            </Link>
          ))}
          <a href={MAIN_APP_URL} className="mt-2 text-center text-[10px] text-purple-400/50 py-2">
            ← Main Dashboard
          </a>
        </nav>
      )}
    </header>
  );
}
