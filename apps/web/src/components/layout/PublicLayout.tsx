"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar, PortalButton, BrandLogo, ParticleField } from "@tasks-cash/ui";
import { motion } from "framer-motion";
import type { Locale } from "@/i18n/config";
import { challengeRoutes } from "@/config/routes";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLocale } from "@/i18n/I18nProvider";
import { stripLocalePrefix, withLocalePrefix } from "@/i18n/locale-path";

const PUBLIC_LINK_DEFS = [
  { href: "/worlds", label: "Worlds" },
  { href: "/missions", label: "Missions" },
  { href: "/mystery-missions", label: "Mystery" },
  { route: "hub" as const, label: "Challenges", external: true },
  { href: "/treasure", label: "Treasure" },
  { route: "rewards" as const, label: "Rewards", external: true },
  { route: "leaderboards" as const, label: "Leaderboards", external: true },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/community", label: "Community" },
] as const;

const FOOTER_SECTION_DEFS = [
  {
    title: "Explore",
    links: [
      { href: "/worlds", label: "Worlds" },
      { href: "/missions", label: "Missions" },
      { href: "/mystery-missions", label: "Mystery Missions" },
      { route: "hub" as const, label: "Challenges", external: true },
      { href: "/treasure", label: "Treasure" },
      { route: "rewards" as const, label: "Rewards", external: true },
      { route: "leaderboards" as const, label: "Leaderboards", external: true },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/marketplace", label: "Marketplace" },
      { href: "/community", label: "Community" },
      { href: "/blog", label: "Blog" },
      { href: "/about", label: "About Us" },
      { href: "/faq", label: "FAQ" },
      { href: "/help", label: "Help Center" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/refund", label: "Refund Policy" },
      { href: "/cookies", label: "Cookie Policy" },
      { href: "/contact", label: "Contact" },
    ],
  },
] as const;

function resolveLink(
  link: { href?: string; route?: keyof ReturnType<typeof challengeRoutes>; label: string; external?: boolean },
  locale: Locale
) {
  if ("route" in link && link.route) {
    return { href: challengeRoutes(locale)[link.route], label: link.label, external: true as const };
  }
  return { href: withLocalePrefix(link.href!, locale), label: link.label, external: false as const };
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const { pathname: bare } = stripLocalePrefix(pathname);

  if (bare === "/") {
    return <>{children}</>;
  }

  const publicLinks = PUBLIC_LINK_DEFS.map((link) => resolveLink(link, locale));
  const footerSections = FOOTER_SECTION_DEFS.map((section) => ({
    title: section.title,
    links: section.links.map((link) => resolveLink(link, locale)),
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        links={publicLinks}
        rightSlot={
          <>
            <LanguageSwitcher className="hidden sm:flex" />
            <Link href={withLocalePrefix("/login", locale)}>
              <PortalButton variant="ghost" size="sm" data-sound="login">
                Login
              </PortalButton>
            </Link>
            <Link href={withLocalePrefix("/register", locale)}>
              <PortalButton variant="gold" size="sm" pulse data-sound="enter-portal">
                Enter The Portal
              </PortalButton>
            </Link>
          </>
        }
      />
      <main className="flex-1">{children}</main>
      <footer className="relative border-t border-purple-500/15 py-16 px-4 overflow-hidden">
        <ParticleField count={25} className="opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-purple-950/50 via-black/80 to-transparent pointer-events-none" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="flex flex-col items-start">
              <BrandLogo size="md" href={withLocalePrefix("/", locale)} showTagline />
              <p className="text-purple-400/50 text-sm leading-relaxed mt-4">
                Complete missions. Earn coins. Ascend through the portal. A premium gamified universe awaits.
              </p>
            </div>
            {footerSections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-bold text-purple-200 mb-4 uppercase tracking-wider">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((l) => (
                    <li key={l.href}>
                      {l.external ? (
                        <a href={l.href} className="text-sm text-purple-300/60 hover:text-amber-300 transition-colors">
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className="text-sm text-purple-300/60 hover:text-amber-300 transition-colors">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-purple-500/10"
          >
            <div className="flex items-center gap-3">
              <BrandLogo size="xs" href={withLocalePrefix("/", locale)} animated={false} />
              <p className="text-purple-400/40 text-sm">© 2026 Tasks.cash — All dimensions reserved.</p>
            </div>
            <div className="flex gap-4 text-sm text-purple-400/50">
              <Link href={withLocalePrefix("/terms", locale)} className="hover:text-purple-200">
                Terms
              </Link>
              <Link href={withLocalePrefix("/privacy", locale)} className="hover:text-purple-200">
                Privacy
              </Link>
              <Link href={withLocalePrefix("/cookies", locale)} className="hover:text-purple-200">
                Cookies
              </Link>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
