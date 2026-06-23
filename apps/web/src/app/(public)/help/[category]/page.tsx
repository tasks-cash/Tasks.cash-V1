"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { GlassCard, PortalButton, MotionReveal } from "@tasks-cash/ui";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { HELP_CATEGORIES, HELP_ARTICLES } from "@/lib/page-data";

export default function HelpCategoryPage() {
  const params = useParams();
  const categoryId = params.category as string;
  const category = HELP_CATEGORIES.find((c) => c.id === categoryId);
  const articles = HELP_ARTICLES.filter((a) => a.category === categoryId);

  if (!category) {
    return (
      <PublicPageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Category Not Found</h1>
          <Link href="/help"><PortalButton variant="gold">Back to Help Center</PortalButton></Link>
        </div>
      </PublicPageWrapper>
    );
  }

  return (
    <PublicPageWrapper>
      <div className="mx-auto max-w-3xl px-4 py-16">
        <MotionReveal>
          <Link href="/help" className="text-sm text-purple-400 hover:text-amber-300">← Help Center</Link>
          <span className="text-5xl block mt-6">{category.icon}</span>
          <h1 className="text-3xl font-bold text-white mt-4">{category.title}</h1>
          <p className="text-purple-200/60 mt-2">{category.articles} articles in this category</p>
        </MotionReveal>

        <div className="mt-10 space-y-4">
          {articles.length > 0 ? articles.map((article, i) => (
            <MotionReveal key={article.id} delay={i * 0.05}>
              <GlassCard className="p-6" hover>
                <h2 className="font-bold text-white">{article.title}</h2>
                <p className="text-purple-200/60 text-sm mt-3 leading-relaxed">
                  This guide covers everything you need to know about {article.title.toLowerCase()}.
                  Follow the steps carefully to maximize your portal experience and avoid common pitfalls
                  that slow down new explorers.
                </p>
                <p className="text-xs text-purple-400/40 mt-3">{article.views.toLocaleString()} views</p>
              </GlassCard>
            </MotionReveal>
          )) : (
            <GlassCard className="p-8 text-center">
              <p className="text-purple-200/60">Articles for this category are being written. Check back soon.</p>
            </GlassCard>
          )}
        </div>

        <div className="mt-12 text-center">
          <Link href="/contact"><PortalButton variant="secondary">Contact Support</PortalButton></Link>
        </div>
      </div>
    </PublicPageWrapper>
  );
}
