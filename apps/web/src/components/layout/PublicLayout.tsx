"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar, PortalButton, BrandLogo, ParticleField } from "@tasks-cash/ui";
import { motion } from "framer-motion";
import { challengeRoutes } from "@/config/routes";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useLocale } from "@/i18n/I18nProvider";
import { stripLocalePrefix, withLocalePrefix } from "@/i18n/locale-path";

function usePublicLinks() {
  const locale = useLocale();
  const challenge = challengeRoutes(locale);
  const prefix = (path: string) => withLocalePrefix(path, locale);

  return {
    nav: [
      { href: prefix("/worlds"), label: "Worlds" },
      { href: prefix("/missions"), label: "Missions" },
      { href: prefix("/mystery-missions"), label: "Mystery" },
      { href: challenge.hub, label: "Challenges", external: true },
      { href: prefix("/treasure"), label: "Treasure" },
      { href: challenge.rewards, label: "Rewards", external: true },
      { href: challenge.leaderboards, label: "Leaderboards", external: true },
      { href: prefix("/marketplace"), label: "Marketplace" },
      { href: prefix("/community"), label: "Community" },
    ],
    footer: [
      {
        title: "Explore",
        links: [
          { href: prefix("/worlds"), label: "Worlds" },
          { href: prefix("/missions"), label: "Missions" },
          { href: prefix("/mystery-missions"), label: "Mystery Missions" },
          { href: challenge.hub, label: "Challenges", external: true },
          { href: prefix("/treasure"), label: "Treasure" },
          { href: challenge.rewards, label: "Rewards", external: true },
          { href: challenge.leaderboards, label: "Leaderboards", external: true },
        ],
      },
      {
        title: "Platform",
        links: [
          { href: prefix("/marketplace"), label: "Marketplace" },
          { href: prefix("/community"), label: "Community" },
          { href: prefix("/blog"), label: "Blog" },
          { href: prefix("/about"), label: "About Us" },
          { href: prefix("/faq"), label: "FAQ" },
          { href: prefix("/help"), label: "Help Center" },
        ],
      },
      {
        title: "Legal",
        links: [
          { href: prefix("/terms"), label: "Terms of Service" },
          { href: prefix("/privacy"), label: "Privacy Policy" },
          { href: prefix("/refund"), label: "Refund Policy" },
          { href: prefix("/cookies"), label: "Cookie Policy" },
          { href: prefix("/contact"), label: "Contact" },
        ],
      },
    ],
    login: prefix("/login"),
    register: prefix("/register"),
    home: prefix("/"),
  };
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const locale = useLocale();
  const { pathname: bare } = stripLocalePrefix(pathname);
  const links = usePublicLinks();

  if (bare === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        links={links.nav}
        rightSlot={
          <>
            <LanguageSwitcher className="hidden sm:flex" />
            <Link href={links.login}><PortalButton variant="ghost" size="sm" data-sound="login">Login</PortalButton></Link>
            <Link href={links.register}><PortalButton variant="gold" size="sm" pulse data-sound="enter-portal">Enter The Portal</PortalButton></Link>
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
              <BrandLogo size="md" href={links.home} showTagline />
              <p className="text-purple-400/50 text-sm leading-relaxed mt-4">
                Complete missions. Earn coins. Ascend through the portal. A premium gamified universe awaits.
              </p>
            </div>
            {links.footer.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-bold text-purple-200 mb-4 uppercase tracking-wider">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((l) => (
                    <li key={l.href}>
                      {"external" in l && l.external ? (
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
              <BrandLogo size="xs" href={links.home} animated={false} />
              <p className="text-purple-400/40 text-sm">© 2026 Tasks.cash — All dimensions reserved.</p>
            </div>
            <div className="flex gap-4 text-sm text-purple-400/50">
              <Link href={withLocalePrefix("/terms", locale)} className="hover:text-purple-200">Terms</Link>
              <Link href={withLocalePrefix("/privacy", locale)} className="hover:text-purple-200">Privacy</Link>
              <Link href={withLocalePrefix("/cookies", locale)} className="hover:text-purple-200">Cookies</Link>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
