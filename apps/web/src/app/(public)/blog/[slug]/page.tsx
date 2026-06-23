"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { GlassCard, PortalButton, Badge, MotionReveal } from "@tasks-cash/ui";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { BLOG_POSTS } from "@/lib/page-data";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return (
      <PublicPageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Article Not Found</h1>
          <p className="text-purple-200/60 mb-8">This intel report has been lost in the void.</p>
          <Link href="/blog"><PortalButton variant="gold">Back to Blog</PortalButton></Link>
        </div>
      </PublicPageWrapper>
    );
  }

  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <PublicPageWrapper>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <MotionReveal>
          <Link href="/blog" className="text-sm text-purple-400 hover:text-amber-300 transition-colors">← Back to Blog</Link>
          <span className="text-5xl block mt-8">{post.icon}</span>
          <Badge variant="default" className="mt-4">{post.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-white mt-4">{post.title}</h1>
          <div className="flex gap-4 text-sm text-purple-400/60 mt-4">
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>
        </MotionReveal>

        <MotionReveal delay={0.1}>
          <GlassCard className="p-8 mt-10">
            <p className="text-purple-200/70 leading-relaxed text-lg mb-6">{post.excerpt}</p>
            <p className="text-purple-200/60 leading-relaxed mb-4">
              The portal universe continues to expand with new dimensions, challenges, and rewards.
              Explorers who master the systems described here gain a significant edge in climbing
              leaderboards and unlocking legendary treasures.
            </p>
            <p className="text-purple-200/60 leading-relaxed mb-4">
              Whether you are a veteran void walker or a fresh initiate, understanding the mechanics
              behind {post.title.toLowerCase()} will accelerate your journey through the multiverse.
            </p>
            <p className="text-purple-200/60 leading-relaxed">
              Stay tuned for more intel from the Void Council. Complete missions, earn coins, and
              ascend through the ranks — the portal awaits your conquest.
            </p>
          </GlassCard>
        </MotionReveal>

        <div className="mt-16">
          <h2 className="text-xl font-bold text-white mb-6">Related Intel</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`}>
                <GlassCard className="p-4 h-full" hover>
                  <span className="text-2xl">{r.icon}</span>
                  <h3 className="font-bold text-white text-sm mt-2">{r.title}</h3>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </article>
    </PublicPageWrapper>
  );
}
