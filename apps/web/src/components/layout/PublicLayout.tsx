"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Navbar, PortalButton, BrandLogo, ParticleField } from "@tasks-cash/ui";
import { motion } from "framer-motion";

const PUBLIC_LINKS = [
  { href: "/worlds", label: "Worlds" },
  { href: "/missions", label: "Missions" },
  { href: "/mystery-missions", label: "Mystery" },
  { href: "/challenges", label: "Challenges" },
  { href: "/treasure", label: "Treasure" },
  { href: "/rewards", label: "Rewards" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/community", label: "Community" },
];

const FOOTER_SECTIONS = [
  {
    title: "Explore",
    links: [
      { href: "/worlds", label: "Worlds" },
      { href: "/missions", label: "Missions" },
      { href: "/mystery-missions", label: "Mystery Missions" },
      { href: "/challenges", label: "Challenges" },
      { href: "/treasure", label: "Treasure" },
      { href: "/rewards", label: "Rewards" },
      { href: "/leaderboards", label: "Leaderboards" },
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
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Homepage has its own header/footer — avoid duplicate chrome
  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        links={PUBLIC_LINKS}
        rightSlot={
          <>
            <Link href="/login"><PortalButton variant="ghost" size="sm" data-sound="login">Login</PortalButton></Link>
            <Link href="/register"><PortalButton variant="gold" size="sm" pulse data-sound="enter-portal">Enter The Portal</PortalButton></Link>
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
              <BrandLogo size="md" href="/" showTagline />
              <p className="text-purple-400/50 text-sm leading-relaxed mt-4">
                Complete missions. Earn coins. Ascend through the portal. A premium gamified universe awaits.
              </p>
            </div>
            {FOOTER_SECTIONS.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-bold text-purple-200 mb-4 uppercase tracking-wider">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-purple-300/60 hover:text-amber-300 transition-colors">
                        {l.label}
                      </Link>
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
              <BrandLogo size="xs" href="/" animated={false} />
              <p className="text-purple-400/40 text-sm">© 2026 Tasks.cash — All dimensions reserved.</p>
            </div>
            <div className="flex gap-4 text-sm text-purple-400/50">
              <Link href="/terms" className="hover:text-purple-200">Terms</Link>
              <Link href="/privacy" className="hover:text-purple-200">Privacy</Link>
              <Link href="/cookies" className="hover:text-purple-200">Cookies</Link>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
