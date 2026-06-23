#!/usr/bin/env node
/**
 * Generates Tasks.cash foundation pages, models, and API routes.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "apps/web/src");
const ADMIN = path.join(ROOT, "apps/admin/src");
const API = path.join(ROOT, "services/api/src");

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log("created:", path.relative(ROOT, filePath));
  }
}

function forceWrite(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  console.log("written:", path.relative(ROOT, filePath));
}

// ─── Shared mock data ───────────────────────────────────────────
forceWrite(
  path.join(WEB, "lib/mock-data.ts"),
  `/** Mock data for pages where backend is not wired yet */
export const WORLDS = [
  { id: "void-nexus", name: "Void Nexus", desc: "A shattered dimension of floating obsidian shards.", difficulty: "Legendary", missions: 12, icon: "🌌" },
  { id: "gold-realm", name: "Gold Realm", desc: "Ancient vaults where portal coins were first forged.", difficulty: "Hard", missions: 18, icon: "👑" },
  { id: "neon-frontier", name: "Neon Frontier", desc: "Cyber-spires pulsing with quantum energy.", difficulty: "Medium", missions: 24, icon: "⚡" },
  { id: "shadow-grove", name: "Shadow Grove", desc: "Whispering forests between dimensions.", difficulty: "Easy", missions: 15, icon: "🌲" },
];

export const PUBLIC_CHALLENGES = [
  { id: "1", title: "7-Day Streak", reward: "500 XP + Badge", endsIn: "3d 12h", participants: 8420 },
  { id: "2", title: "Coin Rush Weekend", reward: "2x Coins", endsIn: "1d 4h", participants: 12050 },
  { id: "3", title: "Portal Sprint", reward: "Legendary Chest", endsIn: "5d 8h", participants: 3100 },
];

export const TREASURES = [
  { id: "1", name: "Obsidian Crown", rarity: "legendary", locked: false, icon: "👑" },
  { id: "2", name: "Quantum Blade", rarity: "epic", locked: true, icon: "⚔️" },
  { id: "3", name: "Void Compass", rarity: "rare", locked: false, icon: "🧭" },
  { id: "4", name: "Portal Key", rarity: "legendary", locked: true, icon: "🔑" },
];

export const STORE_ITEMS = [
  { id: "1", name: "XP Boost 24h", price: 250, type: "boost", icon: "⚡" },
  { id: "2", name: "Gold Frame", price: 500, type: "cosmetic", icon: "🖼️" },
  { id: "3", name: "Mission Reroll", price: 150, type: "utility", icon: "🔄" },
  { id: "4", name: "Portal Emote Pack", price: 800, type: "cosmetic", icon: "✨" },
];

export const FAQ_ITEMS = [
  { q: "What is Tasks.cash?", a: "A gamified task platform where real-world missions earn XP, coins, and legendary rewards." },
  { q: "How do I earn coins?", a: "Complete missions, win challenges, refer allies, and climb leaderboards." },
  { q: "Can I withdraw coins?", a: "Yes — eligible balances can be withdrawn through your dashboard wallet." },
  { q: "Is there a mobile app?", a: "The platform is mobile-first responsive; native apps are on the roadmap." },
];

export const LEADERBOARD_MOCK = [
  { rank: 1, username: "VoidKing", level: 42, xp: 98500, coins: 12400 },
  { rank: 2, username: "NovaBlade", level: 38, xp: 87200, coins: 9800 },
  { rank: 3, username: "GoldWarden", level: 35, xp: 76100, coins: 8900 },
  { rank: 4, username: "PortalMage", level: 31, xp: 65400, coins: 7200 },
  { rank: 5, username: "StarRunner", level: 28, xp: 58900, coins: 6100 },
];

export const ADMIN_STATS = [
  { label: "Total Users", value: "12,847", change: "+12%" },
  { label: "Active Missions", value: "156", change: "+3" },
  { label: "Pending Withdrawals", value: "23", change: "⚠" },
  { label: "Revenue (Coins)", value: "2.4M", change: "+8%" },
];
`
);

// ─── Public layout components ───────────────────────────────────
forceWrite(
  path.join(WEB, "components/layout/PublicLayout.tsx"),
  `"use client";

import Link from "next/link";
import { Navbar, PortalButton, GlowText } from "@tasks-cash/ui";

const PUBLIC_LINKS = [
  { href: "/worlds", label: "Worlds" },
  { href: "/challenges", label: "Challenges" },
  { href: "/missions", label: "Missions" },
  { href: "/treasure", label: "Treasure" },
  { href: "/leaderboards", label: "Leaderboards" },
  { href: "/store", label: "Store" },
];

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/community", label: "Community" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        links={PUBLIC_LINKS}
        rightSlot={
          <>
            <Link href="/login"><PortalButton variant="ghost" size="sm">Login</PortalButton></Link>
            <Link href="/register"><PortalButton variant="gold" size="sm">Enter Portal</PortalButton></Link>
          </>
        }
      />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-purple-500/10 py-12 px-4">
        <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-8">
          <div>
            <GlowText variant="gold" className="text-xl mb-2">Tasks.cash</GlowText>
            <p className="text-purple-400/50 text-sm">Complete missions. Earn coins. Ascend through the portal.</p>
          </div>
          <div className="flex flex-wrap gap-4 md:justify-center">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-purple-300/60 hover:text-purple-200">{l.label}</Link>
            ))}
          </div>
          <p className="text-purple-400/40 text-sm md:text-right">© 2026 Tasks.cash — All dimensions reserved.</p>
        </div>
      </footer>
    </div>
  );
}
`
);

forceWrite(
  path.join(WEB, "components/layout/PageHero.tsx"),
  `"use client";

import { GlowText, MotionReveal } from "@tasks-cash/ui";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  variant?: "default" | "gold";
}

export function PageHero({ eyebrow, title, subtitle, variant = "default" }: PageHeroProps) {
  return (
    <section className="relative py-20 px-4 text-center overflow-hidden">
      <div className="portal-ring absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none" />
      <MotionReveal className="relative z-10 max-w-3xl mx-auto">
        {eyebrow && <p className="text-sm uppercase tracking-[0.3em] text-purple-400/70 mb-4">{eyebrow}</p>}
        <GlowText as="h1" variant={variant === "gold" ? "gold" : "default"} className="text-4xl md:text-5xl mb-4">
          {title}
        </GlowText>
        {subtitle && <p className="text-purple-200/60 text-lg">{subtitle}</p>}
      </MotionReveal>
    </section>
  );
}
`
);

forceWrite(
  path.join(WEB, "components/layout/AuthLayout.tsx"),
  `"use client";

import Link from "next/link";
import { GlassCard, GlowText, MotionReveal } from "@tasks-cash/ui";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="portal-ring absolute h-80 w-80 opacity-15 pointer-events-none animate-portal-spin" />
      <MotionReveal className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/"><GlowText variant="gold" className="text-2xl">Tasks.cash</GlowText></Link>
          <h1 className="text-2xl font-bold text-white mt-6">{title}</h1>
          {subtitle && <p className="text-purple-300/60 text-sm mt-2">{subtitle}</p>}
        </div>
        <GlassCard glow="purple" className="p-8">{children}</GlassCard>
      </MotionReveal>
    </div>
  );
}
`
);

// Public pages generator
const publicPages = {
  about: { title: "About the Portal", subtitle: "Where real tasks become epic quests across the multiverse.", eyebrow: "Our Story" },
  worlds: { title: "Dimensional Worlds", subtitle: "Explore realms, each with unique missions and treasures.", eyebrow: "Explore", data: "worlds" },
  challenges: { title: "Live Challenges", subtitle: "Timed events with massive XP and coin rewards.", eyebrow: "Compete", data: "challenges" },
  missions: { title: "Public Missions", subtitle: "Preview quests available inside the portal.", eyebrow: "Quest Board", data: "missions" },
  treasure: { title: "Treasure Vault", subtitle: "Legendary artifacts unlocked through dedication.", eyebrow: "Artifacts", data: "treasure" },
  leaderboards: { title: "Global Leaderboards", subtitle: "The greatest portal warriors ranked by XP.", eyebrow: "Rankings", data: "leaderboard" },
  community: { title: "Portal Community", subtitle: "Connect with warriors, guilds, and dimensional allies.", eyebrow: "Allies" },
  store: { title: "Portal Store", subtitle: "Spend coins on boosts, cosmetics, and utilities.", eyebrow: "Marketplace", data: "store" },
  faq: { title: "FAQ", subtitle: "Answers to common portal questions.", eyebrow: "Help", data: "faq" },
  contact: { title: "Contact Us", subtitle: "Reach the Tasks.cash support council.", eyebrow: "Support", data: "contact" },
  terms: { title: "Terms of Service", subtitle: "Rules governing your journey through the portal.", eyebrow: "Legal", data: "legal" },
  privacy: { title: "Privacy Policy", subtitle: "How we protect your data across dimensions.", eyebrow: "Legal", data: "legal" },
};

for (const [slug, meta] of Object.entries(publicPages)) {
  const content = generatePublicPage(slug, meta);
  write(path.join(WEB, `app/(public)/${slug}/page.tsx`), content);
}

// Move home to public group layout
write(
  path.join(WEB, "app/(public)/layout.tsx"),
  `import { PublicLayout } from "@/components/layout/PublicLayout";

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>;
}
`
);

// Auth pages
const authPages = ["login", "register", "forgot-password", "reset-password", "verify-email"];
for (const slug of authPages) {
  write(path.join(WEB, `app/(auth)/${slug}/page.tsx`), generateAuthPage(slug));
}

write(
  path.join(WEB, "app/(auth)/layout.tsx"),
  `export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
`
);

// Dashboard pages
const dashPages = {
  "": { title: "Command Center", component: "overview" },
  missions: { title: "My Missions", component: "missions" },
  "missions/submit": { title: "Submit Mission Proof", component: "submit" },
  rewards: { title: "My Rewards", component: "rewards" },
  wallet: { title: "Wallet", component: "wallet" },
  withdrawals: { title: "Withdrawals", component: "withdrawals" },
  referrals: { title: "Referral System", component: "referrals" },
  level: { title: "My Level & XP", component: "level" },
  leaderboard: { title: "Leaderboard Rank", component: "leaderboard" },
  notifications: { title: "Notifications", component: "notifications" },
  profile: { title: "Profile Settings", component: "profile" },
  security: { title: "Security Settings", component: "security" },
  support: { title: "Support Tickets", component: "support" },
};

for (const [slug, meta] of Object.entries(dashPages)) {
  const filePath = slug ? `app/dashboard/${slug}/page.tsx` : "app/dashboard/page.tsx";
  write(path.join(WEB, filePath), generateDashboardPage(meta));
}

forceWrite(
  path.join(WEB, "app/dashboard/layout.tsx"),
  generateDashboardLayout()
);

// Admin pages
const adminPages = [
  ["dashboard", "Admin Overview"],
  ["users", "Users Management"],
  ["users/add", "Add User"],
  ["users/[id]/edit", "Edit User"],
  ["employees", "Employees Management"],
  ["employees/add", "Add Employee"],
  ["missions", "Missions Management"],
  ["missions/add", "Add Mission"],
  ["missions/[id]/edit", "Edit Mission"],
  ["levels", "Levels Management"],
  ["levels/add", "Add Level"],
  ["rewards", "Rewards Management"],
  ["rewards/add", "Add Reward"],
  ["treasures", "Treasure Management"],
  ["withdrawals", "Withdrawals Management"],
  ["referrals", "Referral Management"],
  ["leaderboards", "Leaderboards Management"],
  ["challenges", "Challenges Management"],
  ["content", "Content Management"],
  ["notifications", "Notifications Management"],
  ["support", "Support Tickets Management"],
  ["settings", "System Settings"],
  ["audit-logs", "Audit Logs"],
  ["roles", "Roles & Permissions"],
];

for (const [slug, title] of adminPages) {
  write(path.join(ADMIN, `app/(admin)/${slug}/page.tsx`), generateAdminPage(title, slug));
}

forceWrite(path.join(ADMIN, "app/(admin)/layout.tsx"), generateAdminLayout());

// API models
const models = generateModels();
for (const [name, content] of Object.entries(models)) {
  write(path.join(API, `models/${name}.ts`), content);
}

// API routes
const routes = generateApiRoutes();
for (const [name, content] of Object.entries(routes)) {
  write(path.join(API, `routes/${name}.ts`), content);
}

// Next.js API route stubs
const nextApiRoutes = [
  "auth/login", "auth/register", "auth/forgot-password", "auth/reset-password", "auth/verify-email",
  "users", "users/dashboard", "employees", "missions", "submissions", "rewards", "wallet",
  "withdrawals", "referrals", "levels", "leaderboards", "challenges", "treasures",
  "notifications", "support", "admin", "settings",
];
for (const route of nextApiRoutes) {
  write(path.join(WEB, `app/api/${route}/route.ts`), generateNextApiRoute(route));
}

console.log("\\nScaffold complete.");

function generatePublicPage(slug, meta) {
  return `"use client";

import Link from "next/link";
import { GlassCard, GlowText, PortalButton, MotionStagger, MotionStaggerItem, LeaderboardRow, MissionCard } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { WORLDS, PUBLIC_CHALLENGES, TREASURES, STORE_ITEMS, FAQ_ITEMS, LEADERBOARD_MOCK } from "@/lib/mock-data";

export default function ${toPascal(slug)}Page() {
  return (
    <div>
      <PageHero eyebrow="${meta.eyebrow}" title="${meta.title}" subtitle="${meta.subtitle}" variant="gold" />
      <div className="mx-auto max-w-6xl px-4 pb-24">
        ${getPublicPageBody(slug, meta)}
      </div>
    </div>
  );
}
`;
}

function getPublicPageBody(slug, meta) {
  const bodies = {
    about: `<div className="grid md:grid-cols-2 gap-8">
          <GlassCard className="p-8"><h2 className="text-xl font-bold text-white mb-4">Our Mission</h2><p className="text-purple-200/60 leading-relaxed">Tasks.cash transforms everyday productivity into an epic journey. We blend dark fantasy aesthetics with sci-fi portal mechanics to make completing real tasks feel like conquering dimensions.</p></GlassCard>
          <GlassCard glow="gold" className="p-8"><h2 className="text-xl font-bold text-amber-300 mb-4">The Vision</h2><p className="text-purple-200/60 leading-relaxed">Build the most immersive gamified task platform — where discipline meets adventure, and every completed mission brings you closer to legendary status.</p></GlassCard>
        </div>`,
    worlds: `<MotionStagger className="grid md:grid-cols-2 gap-6">{WORLDS.map((w) => (<MotionStaggerItem key={w.id}><GlassCard className="p-6 h-full"><span className="text-4xl">{w.icon}</span><h3 className="text-xl font-bold text-white mt-4">{w.name}</h3><p className="text-purple-200/60 text-sm mt-2">{w.desc}</p><div className="flex justify-between mt-4 text-xs text-purple-400"><span>{w.difficulty}</span><span>{w.missions} missions</span></div></GlassCard></MotionStaggerItem>))}</MotionStagger>`,
    challenges: `<MotionStagger className="grid md:grid-cols-3 gap-6">{PUBLIC_CHALLENGES.map((c) => (<MotionStaggerItem key={c.id}><GlassCard glow="gold" className="p-6"><h3 className="text-lg font-bold text-white">{c.title}</h3><p className="text-amber-300/80 text-sm mt-2">{c.reward}</p><p className="text-purple-400/60 text-xs mt-4">Ends in {c.endsIn} · {c.participants.toLocaleString()} warriors</p><Link href="/register" className="block mt-4"><PortalButton variant="gold" size="sm" className="w-full">Join Challenge</PortalButton></Link></GlassCard></MotionStaggerItem>))}</MotionStagger>`,
    missions: `<MotionStagger className="grid md:grid-cols-2 gap-6">{[{ title: "Daily Portal Scan", difficulty: "easy" as const, coinReward: 50, xpReward: 100, category: "Daily" }, { title: "Void Expedition", difficulty: "hard" as const, coinReward: 200, xpReward: 500, category: "Adventure" }, { title: "Gold Vault Raid", difficulty: "legendary" as const, coinReward: 500, xpReward: 1000, category: "Elite" }].map((m, i) => (<MotionStaggerItem key={i}><MissionCard mission={m} /></MotionStaggerItem>))}</MotionStagger><div className="text-center mt-12"><Link href="/register"><PortalButton variant="gold" size="lg">Unlock All Missions</PortalButton></Link></div>`,
    treasure: `<MotionStagger className="grid grid-cols-2 md:grid-cols-4 gap-6">{TREASURES.map((t) => (<MotionStaggerItem key={t.id}><GlassCard className={\`p-6 text-center \${t.locked ? "opacity-50" : ""}\`} glow={t.rarity === "legendary" ? "gold" : "purple"}><span className="text-5xl block mb-3">{t.icon}</span><h3 className="font-bold text-white">{t.name}</h3><p className="text-xs uppercase tracking-wider text-purple-400 mt-2">{t.rarity}{t.locked ? " · Locked" : ""}</p></GlassCard></MotionStaggerItem>))}</MotionStagger>`,
    leaderboards: `<GlassCard className="p-6">{LEADERBOARD_MOCK.map((e) => (<LeaderboardRow key={e.rank} entry={{ ...e, userId: String(e.rank), completedMissions: 10 + e.rank }} highlight={e.rank <= 3} />))}</GlassCard>`,
    community: `<div className="grid md:grid-cols-3 gap-6">{["Discord Guilds", "Portal Forums", "Live Events"].map((name) => (<GlassCard key={name} className="p-6 text-center"><span className="text-4xl">👥</span><h3 className="text-lg font-bold text-white mt-4">{name}</h3><p className="text-purple-200/60 text-sm mt-2">Connect with thousands of portal warriors.</p><PortalButton variant="secondary" size="sm" className="mt-4">Coming Soon</PortalButton></GlassCard>))}</div>`,
    store: `<MotionStagger className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">{STORE_ITEMS.map((item) => (<MotionStaggerItem key={item.id}><GlassCard className="p-6"><span className="text-3xl">{item.icon}</span><h3 className="font-bold text-white mt-3">{item.name}</h3><p className="text-amber-400 font-bold mt-2">{item.price} ◈</p><PortalButton variant="gold" size="sm" className="mt-4 w-full">Purchase</PortalButton></GlassCard></MotionStaggerItem>))}</MotionStagger>`,
    faq: `<div className="space-y-4 max-w-3xl mx-auto">{FAQ_ITEMS.map((item, i) => (<GlassCard key={i} className="p-6"><h3 className="font-bold text-white mb-2">{item.q}</h3><p className="text-purple-200/60 text-sm">{item.a}</p></GlassCard>))}</div>`,
    contact: `<GlassCard className="p-8 max-w-xl mx-auto"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><label className="text-sm text-purple-300">Name</label><input className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white" placeholder="Your name" /></div><div><label className="text-sm text-purple-300">Email</label><input type="email" className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white" placeholder="you@email.com" /></div><div><label className="text-sm text-purple-300">Message</label><textarea rows={4} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white" placeholder="How can we help?" /></div><PortalButton variant="gold" className="w-full">Send Message</PortalButton></form></GlassCard>`,
    terms: `<GlassCard className="p-8 max-w-3xl mx-auto prose prose-invert"><h2 className="text-white">1. Acceptance</h2><p className="text-purple-200/60">By entering the portal, you agree to these terms.</p><h2 className="text-white mt-6">2. Account</h2><p className="text-purple-200/60">You are responsible for maintaining account security.</p><h2 className="text-white mt-6">3. Rewards</h2><p className="text-purple-200/60">Virtual coins and rewards are subject to platform rules and withdrawal policies.</p></GlassCard>`,
    privacy: `<GlassCard className="p-8 max-w-3xl mx-auto"><h2 className="text-white font-bold mb-4">Data Collection</h2><p className="text-purple-200/60 mb-6">We collect account information, mission activity, and usage analytics to improve the platform.</p><h2 className="text-white font-bold mb-4">Your Rights</h2><p className="text-purple-200/60">You may request data export or deletion through support tickets.</p></GlassCard>`,
  };
  return bodies[slug] || `<GlassCard className="p-8 text-center"><p className="text-purple-200/60">Content coming soon.</p></GlassCard>`;
}

function generateAuthPage(slug) {
  const pages = {
    login: { title: "Return to Portal", fields: "email,password", extra: `<p className="text-center text-sm text-purple-400/60 mt-4">No account? <Link href="/register" className="text-amber-400 hover:underline">Enter the portal</Link></p><p className="text-center text-sm mt-2"><Link href="/forgot-password" className="text-purple-400 hover:underline">Forgot password?</Link></p>` },
    register: { title: "Enter the Portal", fields: "username,email,password", extra: `<p className="text-center text-sm text-purple-400/60 mt-4">Already a warrior? <Link href="/login" className="text-amber-400 hover:underline">Login</Link></p>` },
    "forgot-password": { title: "Reset Portal Key", fields: "email", extra: `<p className="text-center text-sm mt-4"><Link href="/login" className="text-purple-400 hover:underline">Back to login</Link></p>` },
    "reset-password": { title: "New Portal Key", fields: "password,confirm", extra: "" },
    "verify-email": { title: "Verify Your Email", fields: "code", extra: `<p className="text-purple-200/60 text-sm text-center mb-4">Enter the 6-digit code sent to your email.</p>` },
  };
  const p = pages[slug];
  return `"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PortalButton, Input, Label } from "@tasks-cash/ui";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { apiFetch, setToken } from "@/lib/api";

export default function ${toPascal(slug.replace(/-/g, " "))}Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const endpoint = "${slug === "login" ? "/api/auth/login" : slug === "register" ? "/api/auth/register" : `/api/auth/${slug}`}";
    const res = await apiFetch<{ accessToken?: string; user?: Record<string, unknown> }>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.success && res.data?.accessToken) {
      setToken(res.data.accessToken);
      if (res.data.user) localStorage.setItem("tc_user", JSON.stringify(res.data.user));
      router.push("/dashboard");
      return;
    }
    if (res.success) {
      router.push("${slug === "forgot-password" ? "/reset-password" : slug === "verify-email" ? "/dashboard" : "/login"}");
      return;
    }
    setError(res.error ?? "Something went wrong");
  }

  return (
    <AuthLayout title="${p.title}" subtitle="Secure portal authentication">
      ${p.extra}
      <form onSubmit={handleSubmit} className="space-y-4">
        ${generateAuthFields(p.fields)}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <PortalButton variant="gold" className="w-full" disabled={loading}>{loading ? "Processing..." : "Continue"}</PortalButton>
      </form>
    </AuthLayout>
  );
}
`;
}

function generateAuthFields(fields) {
  const map = {
    username: `<div><Label htmlFor="username">Username</Label><Input id="username" name="username" required className="mt-1" placeholder="VoidRunner" /></div>`,
    email: `<div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required className="mt-1" placeholder="warrior@portal.io" /></div>`,
    password: `<div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required className="mt-1" placeholder="••••••••" /></div>`,
    confirm: `<div><Label htmlFor="confirm">Confirm Password</Label><Input id="confirm" name="confirm" type="password" required className="mt-1" placeholder="••••••••" /></div>`,
    code: `<div><Label htmlFor="code">Verification Code</Label><Input id="code" name="code" required className="mt-1 text-center tracking-[0.5em]" placeholder="000000" maxLength={6} /></div>`,
  };
  return fields.split(",").map((f) => map[f.trim()]).join("\n        ");
}

function generateDashboardPage(meta) {
  return `"use client";

import { GlassCard, GlowText, StatWidget, PortalButton, Input, Label, LevelBar, NotificationItem } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <GlowText as="h1" className="text-3xl">${meta.title}</GlowText>
        <p className="text-purple-300/60 mt-1">Manage your portal journey</p>
      </div>
      ${getDashboardBody(meta.component)}
    </div>
  );
}
`;
}

function getDashboardBody(component) {
  const bodies = {
    overview: `<GlassCard className="p-6 mb-8"><LevelBar level={12} progress={65} title="Void Walker" xpCurrent={6500} xpRequired={10000} /></GlassCard><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"><StatWidget label="Coins" value="2,450" icon="◈" glow="gold" /><StatWidget label="XP" value="6,500" icon="⚡" /><StatWidget label="Missions" value="34" icon="⚔️" /><StatWidget label="Rank" value="#128" icon="🏆" glow="gold" /></div>`,
    missions: `<div className="grid md:grid-cols-2 gap-4">{["Daily Portal Scan", "Neon Data Harvest", "Gold Vault Patrol"].map((m) => (<GlassCard key={m} className="p-6 flex justify-between items-center"><div><h3 className="font-bold text-white">{m}</h3><p className="text-sm text-purple-400/60">In progress</p></div><PortalButton variant="gold" size="sm">Complete</PortalButton></GlassCard>))}</div>`,
    submit: `<GlassCard className="p-8 max-w-xl"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><Label>Mission</Label><Input className="mt-1" placeholder="Select mission..." /></div><div><Label>Proof URL / Description</Label><textarea className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white min-h-[120px]" placeholder="Describe your completion proof..." /></div><PortalButton variant="gold">Submit Proof</PortalButton></form></GlassCard>`,
    rewards: `<div className="grid md:grid-cols-3 gap-4">{[{ name: "Void Badge", rarity: "epic" }, { name: "Coin Multiplier", rarity: "rare" }, { name: "Portal Frame", rarity: "legendary" }].map((r) => (<GlassCard key={r.name} glow="gold" className="p-6 text-center"><span className="text-4xl">🎁</span><h3 className="font-bold text-white mt-3">{r.name}</h3><p className="text-xs uppercase text-purple-400 mt-2">{r.rarity}</p></GlassCard>))}</div>`,
    wallet: `<GlassCard glow="gold" className="p-8 mb-6"><p className="text-purple-400/60 text-sm">Balance</p><p className="text-4xl font-black text-amber-400">2,450 ◈</p></GlassCard><GlassCard className="p-6"><h3 className="font-bold text-white mb-4">Recent Transactions</h3>{["Mission reward +150", "Store purchase -250", "Referral bonus +50"].map((t) => (<p key={t} className="text-sm text-purple-200/60 py-2 border-b border-purple-500/10">{t}</p>))}</GlassCard>`,
    withdrawals: `<GlassCard className="p-8 max-w-xl"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><Label>Amount (coins)</Label><Input type="number" className="mt-1" placeholder="500" /></div><div><Label>Payment Method</Label><Input className="mt-1" placeholder="PayPal / Crypto wallet" /></div><PortalButton variant="gold">Request Withdrawal</PortalButton></form></GlassCard>`,
    referrals: `<GlassCard glow="gold" className="p-8 text-center"><p className="text-sm text-purple-400/60">Your Referral Code</p><p className="text-3xl font-black text-amber-400 tracking-widest mt-2">VOID-7X9K</p><p className="text-purple-400/60 text-sm mt-4">12 allies · 600 bonus coins earned</p></GlassCard>`,
    level: `<GlassCard className="p-8"><LevelBar level={12} progress={65} title="Void Walker" xpCurrent={6500} xpRequired={10000} /><div className="mt-8 grid grid-cols-2 gap-4"><StatWidget label="Current Level" value="12" icon="⚡" /><StatWidget label="Next Title" value="Gold Warden" icon="👑" glow="gold" /></div></GlassCard>`,
    leaderboard: `<GlassCard className="p-6"><p className="text-amber-400 font-bold text-2xl mb-4">Your Rank: #128</p><p className="text-purple-200/60">Keep completing missions to climb the global leaderboard.</p></GlassCard>`,
    notifications: `<div className="space-y-3">{[{ title: "Mission Complete", message: "You earned 150 coins", read: false }, { title: "Level Up!", message: "You reached level 12", read: true }].map((n, i) => (<NotificationItem key={i} notification={{ _id: String(i), userId: "1", type: "system", ...n, createdAt: new Date() }} />))}</div>`,
    profile: `<GlassCard className="p-8 max-w-xl"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><Label>Username</Label><Input defaultValue="VoidRunner" className="mt-1" /></div><div><Label>Email</Label><Input defaultValue="warrior@portal.io" className="mt-1" /></div><div><Label>Bio</Label><textarea className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white" rows={3} /></div><PortalButton variant="gold">Save Profile</PortalButton></form></GlassCard>`,
    security: `<GlassCard className="p-8 max-w-xl space-y-6"><div><Label>Current Password</Label><Input type="password" className="mt-1" /></div><div><Label>New Password</Label><Input type="password" className="mt-1" /></div><PortalButton variant="gold">Update Password</PortalButton><hr className="border-purple-500/20" /><p className="text-sm text-purple-300/60">Two-factor authentication — coming soon</p></GlassCard>`,
    support: `<GlassCard className="p-8 max-w-xl"><form className="space-y-4" onSubmit={(e) => e.preventDefault()}><div><Label>Subject</Label><Input className="mt-1" placeholder="Issue summary" /></div><div><Label>Description</Label><textarea className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white min-h-[120px]" /></div><PortalButton variant="gold">Open Ticket</PortalButton></form></GlassCard>`,
  };
  return bodies[component] || `<GlassCard className="p-8"><p className="text-purple-200/60">Dashboard section ready.</p></GlassCard>`;
}

function generateDashboardLayout() {
  return `"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar, PortalButton, CoinBadge, Badge, PageTransition, GlowText } from "@tasks-cash/ui";
import { clearToken, getToken, apiFetch } from "@/lib/api";

const NAV_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/missions", label: "Missions" },
  { href: "/dashboard/rewards", label: "Rewards" },
  { href: "/dashboard/wallet", label: "Wallet" },
  { href: "/dashboard/withdrawals", label: "Withdrawals" },
  { href: "/dashboard/referrals", label: "Referrals" },
  { href: "/dashboard/level", label: "Level" },
  { href: "/dashboard/leaderboard", label: "Rank" },
  { href: "/dashboard/notifications", label: "Alerts" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/security", label: "Security" },
  { href: "/dashboard/support", label: "Support" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [coins, setCoins] = useState(0);
  const [username, setUsername] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    const user = localStorage.getItem("tc_user");
    if (user) { const p = JSON.parse(user); setCoins(p.coins ?? 0); setUsername(p.username ?? ""); }
    apiFetch<{ count: number }>("/api/notifications/unread-count").then((res) => {
      if (res.success && res.data) setUnreadCount(res.data.count);
    });
  }, [router, pathname]);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden xl:flex w-64 flex-col border-r border-purple-500/20 bg-purple-950/30 backdrop-blur-xl p-6">
        <Link href="/"><GlowText variant="gold" className="text-lg">Tasks.cash</GlowText></Link>
        <p className="text-purple-400/50 text-xs mb-6 mt-1">Warrior Dashboard</p>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className={\`block rounded-xl px-3 py-2 text-sm transition-all \${pathname === item.href ? "bg-purple-600/30 text-white border border-purple-500/30" : "text-purple-300/70 hover:bg-purple-950/50"}\`}>{item.label}</Link>
          ))}
        </nav>
        <PortalButton variant="ghost" size="sm" onClick={() => { clearToken(); router.push("/"); }}>Logout</PortalButton>
      </aside>
      <div className="flex-1 min-w-0">
        <Navbar links={[]} rightSlot={<div className="flex items-center gap-3"><Link href="/dashboard/notifications" className="relative">🔔{unreadCount > 0 && <Badge variant="gold" className="absolute -top-2 -right-3">{unreadCount}</Badge>}</Link><CoinBadge amount={coins} size="sm" /><span className="hidden sm:block text-sm text-purple-300">{username}</span></div>} />
        <main className="mx-auto max-w-7xl px-4 py-8"><PageTransition key={pathname}>{children}</PageTransition></main>
      </div>
    </div>
  );
}
`;
}

function generateAdminPage(title, slug) {
  const isForm = slug.includes("/add") || slug.includes("/edit");
  return `"use client";

import { GlassCard, GlowText, PortalButton, Input, Label, StatWidget } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><GlowText as="h1" className="text-3xl">${title}</GlowText><p className="text-purple-300/60 mt-1">Admin control panel</p></div>
        ${!isForm && slug !== "dashboard" ? `<PortalButton variant="gold" size="sm">+ Add New</PortalButton>` : ""}
      </div>
      ${slug === "dashboard" ? `<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{ADMIN_STATS.map((s) => (<StatWidget key={s.label} label={s.label} value={s.value} icon="◈" glow="gold" />))}</div>` : ""}
      ${isForm ? `<GlassCard className="p-8 max-w-2xl"><form className="grid gap-4" onSubmit={(e) => e.preventDefault()}><div><Label>Title / Name</Label><Input className="mt-1" /></div><div><Label>Description</Label><textarea className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white min-h-[100px]" /></div><PortalButton variant="gold">Save</PortalButton></form></GlassCard>` : `<GlassCard className="p-6 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-purple-400/60 border-b border-purple-500/20"><th className="pb-3 pr-4">ID</th><th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Actions</th></tr></thead><tbody>{[1,2,3,4,5].map((i) => (<tr key={i} className="border-b border-purple-500/10"><td className="py-3 pr-4 text-purple-300">#${slug.slice(0,3).toUpperCase()}{1000+i}</td><td className="py-3 pr-4 text-white">Sample Entry {i}</td><td className="py-3 pr-4 text-green-400">Active</td><td className="py-3"><PortalButton variant="ghost" size="sm">Edit</PortalButton></td></tr>))}</tbody></table></GlassCard>`}
    </div>
  );
}
`;
}

function generateAdminLayout() {
  return `"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { GlowText, PortalButton } from "@tasks-cash/ui";
import { getToken } from "@/lib/api";

const ADMIN_NAV = [
  { href: "/dashboard", label: "Overview", icon: "◈" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/employees", label: "Employees", icon: "🛡️" },
  { href: "/missions", label: "Missions", icon: "⚔️" },
  { href: "/levels", label: "Levels", icon: "⚡" },
  { href: "/rewards", label: "Rewards", icon: "🎁" },
  { href: "/treasures", label: "Treasures", icon: "💎" },
  { href: "/withdrawals", label: "Withdrawals", icon: "◈" },
  { href: "/referrals", label: "Referrals", icon: "🔗" },
  { href: "/leaderboards", label: "Leaderboards", icon: "🏆" },
  { href: "/challenges", label: "Challenges", icon: "🎯" },
  { href: "/content", label: "Content", icon: "📄" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/support", label: "Support", icon: "💬" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/audit-logs", label: "Audit Logs", icon: "📋" },
  { href: "/roles", label: "Roles", icon: "🔐" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { if (!getToken()) router.push("/"); }, [router]);

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex w-64 flex-col border-r border-purple-500/20 bg-purple-950/30 backdrop-blur-xl p-6">
        <GlowText as="h1" variant="gold" className="text-xl mb-1">Tasks.cash</GlowText>
        <p className="text-purple-400/50 text-xs mb-6">Admin Control Panel</p>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href} className={\`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all \${pathname.startsWith(item.href) && item.href !== "/dashboard" ? "bg-purple-600/30 text-white border border-purple-500/30" : pathname === item.href ? "bg-purple-600/30 text-white border border-purple-500/30" : "text-purple-300/70 hover:bg-purple-950/50"}\`}>
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <PortalButton variant="ghost" size="sm" onClick={() => { localStorage.removeItem("tc_token"); router.push("/"); }}>Logout</PortalButton>
      </aside>
      <div className="flex-1 min-w-0"><main className="p-6">{children}</main></div>
    </div>
  );
}
`;
}

function generateModels() {
  const base = (name, fields) => `import mongoose, { Document, Schema } from "mongoose";

export interface I${name}Document extends Document {
${fields.map((f) => `  ${f};`).join("\n")}
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<I${name}Document>({
${fields.map((f) => {
  const [key] = f.split(":");
  return `  ${key.trim()}: { type: Schema.Types.Mixed },`;
}).join("\n")}
}, { timestamps: true });

export const ${name} = mongoose.models.${name} ?? mongoose.model<I${name}Document>("${name}", schema);
`;

  return {
    Employee: base("Employee", ["userId: mongoose.Types.ObjectId", "department: string", "position: string", "isActive: boolean"]),
    MissionSubmission: base("MissionSubmission", ["userId: mongoose.Types.ObjectId", "missionId: mongoose.Types.ObjectId", "proof: string", "status: string", "reviewedBy: mongoose.Types.ObjectId"]),
    Wallet: base("Wallet", ["userId: mongoose.Types.ObjectId", "balance: number", "totalEarned: number", "totalSpent: number"]),
    Withdrawal: base("Withdrawal", ["userId: mongoose.Types.ObjectId", "amount: number", "method: string", "status: string", "processedAt: Date"]),
    Level: base("Level", ["level: number", "xpRequired: number", "title: string", "perks: string[]"]),
    Leaderboard: base("Leaderboard", ["name: string", "type: string", "entries: Record<string, unknown>[]", "isActive: boolean"]),
    Challenge: base("Challenge", ["title: string", "description: string", "reward: string", "startsAt: Date", "endsAt: Date", "isActive: boolean"]),
    Treasure: base("Treasure", ["name: string", "description: string", "rarity: string", "requiredLevel: number", "icon: string", "isActive: boolean"]),
    SupportTicket: base("SupportTicket", ["userId: mongoose.Types.ObjectId", "subject: string", "message: string", "status: string", "priority: string"]),
    AuditLog: base("AuditLog", ["actorId: mongoose.Types.ObjectId", "action: string", "resource: string", "metadata: Record<string, unknown>"]),
    Role: base("Role", ["name: string", "slug: string", "permissions: string[]"]),
    Permission: base("Permission", ["name: string", "slug: string", "description: string"]),
    SystemSetting: base("SystemSetting", ["key: string", "value: unknown", "category: string"]),
  };
}

function generateApiRoutes() {
  const stub = (name) => `import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, async (_req, res) => {
  res.json({ success: true, data: [], message: "${name} endpoint ready" });
});

router.post("/", authenticate, requireAdmin, async (_req, res) => {
  res.json({ success: true, message: "${name} created" });
});

export default router;
`;

  return {
    employees: stub("employees"),
    submissions: stub("submissions"),
    withdrawals: stub("withdrawals"),
    levels: stub("levels"),
    challenges: stub("challenges"),
    treasures: stub("treasures"),
    support: stub("support"),
  };
}

function generateNextApiRoute(route) {
  return `import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Proxy to Express API — ${route} */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = await fetch(\`\${API_URL}/api/${route}\${url.search}\`, {
    headers: { Authorization: request.headers.get("Authorization") ?? "" },
  });
  return NextResponse.json(await res.json());
}

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(\`\${API_URL}/api/${route}\`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: request.headers.get("Authorization") ?? "",
    },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}
`;
}

function toPascal(str) {
  return str.replace(/(?:^|\\s|-)(\\w)/g, (_, c) => c.toUpperCase()).replace(/\\s/g, "");
}
