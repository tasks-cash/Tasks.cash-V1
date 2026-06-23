"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrandLogo, GameButton } from "@tasks-cash/ui";

const NAV = [
  { href: "/worlds", label: "Worlds" },
  { href: "/missions", label: "Missions" },
  { href: "/treasure", label: "Treasure" },
  { href: "/leaderboards", label: "Rankings" },
  { href: "/community", label: "Community" },
];

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
];

export function HomepageHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("EN");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[60] w-full transition-all duration-500 ${
        scrolled
          ? "bg-black/75 backdrop-blur-2xl border-b border-purple-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-3 lg:py-4">
        <BrandLogo size="lg" href="/" animated={false} className="shrink-0" />

        <nav className="hidden xl:flex items-center gap-1">
          {NAV.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hp-nav-link px-4 py-2 text-sm font-[family-name:var(--font-rajdhani)] font-semibold uppercase tracking-widest text-purple-200/70 hover:text-amber-300 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative w-full group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400/50 text-sm">⌕</span>
            <input
              type="search"
              placeholder="Search worlds, missions..."
              className="hp-search w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-[family-name:var(--font-inter)]"
              aria-label="Search"
            />
            <div className="absolute inset-0 rounded-xl border border-purple-500/0 group-hover:border-purple-500/30 group-focus-within:border-violet-400/50 pointer-events-none transition-colors" />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="hp-lang-btn px-3 py-2 rounded-lg text-xs font-[family-name:var(--font-orbitron)] font-bold uppercase tracking-wider"
              aria-label="Select language"
            >
              {lang} ▾
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-2 min-w-[100px] rounded-xl border border-purple-500/30 bg-black/90 backdrop-blur-xl overflow-hidden shadow-glow-purple"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => { setLang(l.label); setLangOpen(false); }}
                      className="block w-full px-4 py-2 text-left text-sm text-purple-200 hover:bg-purple-900/50 hover:text-amber-300 transition-colors"
                    >
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/login" className="hidden sm:block">
            <GameButton variant="ghost" size="sm" data-sound="login">Login</GameButton>
          </Link>
          <Link href="/register">
            <GameButton variant="gold" size="sm" pulse className="hp-btn-glow" data-sound="register">
              Register
            </GameButton>
          </Link>

          <button
            type="button"
            aria-label="Menu"
            className="xl:hidden p-2 rounded-lg border border-purple-500/30 bg-black/40"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <motion.span className="block h-0.5 w-6 bg-purple-300 mb-1.5" animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }} />
            <motion.span className="block h-0.5 w-6 bg-purple-300 mb-1.5" animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} />
            <motion.span className="block h-0.5 w-6 bg-purple-300" animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="xl:hidden overflow-hidden border-t border-purple-500/20 bg-black/95 backdrop-blur-2xl"
          >
            <div className="px-4 py-6 space-y-1">
              <input type="search" placeholder="Search..." className="hp-search w-full px-4 py-3 rounded-xl mb-4 md:hidden" />
              {NAV.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-purple-200 hover:bg-purple-900/40 font-[family-name:var(--font-rajdhani)] uppercase tracking-widest"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 pt-4 border-t border-purple-500/20 sm:hidden">
                <Link href="/login" className="flex-1"><GameButton variant="ghost" size="sm" className="w-full">Login</GameButton></Link>
                <Link href="/register" className="flex-1"><GameButton variant="gold" size="sm" className="w-full">Register</GameButton></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
