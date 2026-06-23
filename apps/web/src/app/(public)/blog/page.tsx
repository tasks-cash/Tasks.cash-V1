"use client";

import Link from "next/link";
import { GlassCard, PortalButton, MotionStagger, MotionStaggerItem, Badge } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader } from "@/components/pages/PublicSections";
import { BLOG_POSTS } from "@/lib/page-data";

const CATEGORIES = [...new Set(BLOG_POSTS.map((p) => p.category))];

export default function BlogPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Intel" title="Portal Blog" subtitle="Announcements, guides, and community stories from across the multiverse." variant="gold" />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeader eyebrow="Latest" title="From the Void Council" />
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {CATEGORIES.map((cat) => (
            <Badge key={cat} variant="default">{cat}</Badge>
          ))}
        </div>

        <MotionStagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => (
            <MotionStaggerItem key={post.id}>
              <Link href={`/blog/${post.slug}`}>
                <GlassCard className="p-6 h-full flex flex-col" hover>
                  <span className="text-4xl">{post.icon}</span>
                  <Badge variant="default" className="mt-4 w-fit">{post.category}</Badge>
                  <h3 className="text-lg font-bold text-white mt-3">{post.title}</h3>
                  <p className="text-purple-200/60 text-sm mt-2 flex-1">{post.excerpt}</p>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-purple-500/10 text-xs text-purple-400/60">
                    <span>{post.author}</span>
                    <span>{post.readTime}</span>
                  </div>
                </GlassCard>
              </Link>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
      </div>

      <div className="mx-auto max-w-3xl px-4 pb-16">
        <GlassCard className="p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Subscribe to Portal Intel</h3>
          <p className="text-purple-200/60 text-sm mb-4">Get the latest updates delivered to your inbox.</p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input className="flex-1 rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm" placeholder="you@email.com" />
            <PortalButton variant="gold" size="sm">Subscribe</PortalButton>
          </div>
        </GlassCard>
      </div>

      <EpicCTA title="Join the Adventure" subtitle="Read the guides, then dive into missions and start earning." primaryHref="/register" primaryLabel="Enter the Portal" secondaryHref="/missions" secondaryLabel="View Missions" />
    </PublicPageWrapper>
  );
}
