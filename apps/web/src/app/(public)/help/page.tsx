"use client";

import Link from "next/link";
import { useState } from "react";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem, Input } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader } from "@/components/pages/PublicSections";
import { HELP_CATEGORIES, HELP_ARTICLES } from "@/lib/page-data";

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const filtered = query
    ? HELP_ARTICLES.filter((a) => a.title.toLowerCase().includes(query.toLowerCase()))
    : HELP_ARTICLES;

  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Support" title="Help Center" subtitle="Find answers, guides, and portal support resources." variant="gold" />

      <div className="mx-auto max-w-3xl px-4 -mt-8 mb-12">
        <GlassCard className="p-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles..."
            className="border-purple-500/20 bg-purple-950/30 text-white"
          />
        </GlassCard>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <SectionHeader eyebrow="Categories" title="Browse by Topic" />
        <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {HELP_CATEGORIES.map((cat) => (
            <MotionStaggerItem key={cat.id}>
              <Link href={`/help/${cat.id}`}>
                <GlassCard className="p-6 h-full" hover>
                  <span className="text-4xl">{cat.icon}</span>
                  <h3 className="text-lg font-bold text-white mt-4">{cat.title}</h3>
                  <p className="text-purple-400/60 text-sm mt-2">{cat.articles} articles</p>
                </GlassCard>
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>

        <SectionHeader eyebrow="Popular" title="Most Viewed Articles" />
        <div className="space-y-3">
          {filtered.map((article) => (
            <GlassCard key={article.id} className="p-4 flex items-center justify-between" hover>
              <div>
                <h3 className="font-medium text-white">{article.title}</h3>
                <p className="text-xs text-purple-400/50 mt-1 capitalize">{article.category.replace("-", " ")}</p>
              </div>
              <span className="text-xs text-purple-400/40">{article.views.toLocaleString()} views</span>
            </GlassCard>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16">
        <GlassCard glow="gold" className="p-8 text-center">
          <h3 className="text-xl font-bold text-amber-300 mb-2">Still Need Help?</h3>
          <p className="text-purple-200/60 mb-6">Our support council responds within 24 hours.</p>
          <Link href="/contact"><PortalButton variant="gold">Contact Support</PortalButton></Link>
        </GlassCard>
      </div>

      <EpicCTA title="Ready to Explore?" subtitle="Create your account and start your portal journey today." primaryLabel="Get Started" />
    </PublicPageWrapper>
  );
}
