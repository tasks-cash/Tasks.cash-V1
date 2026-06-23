"use client";

import { GlassCard, PortalButton, Input, Label, MotionReveal } from "@tasks-cash/ui";
import { PageHero } from "@/components/layout/PageHero";
import { PublicPageWrapper } from "@/components/premium/PublicPageWrapper";
import { EpicCTA, SectionHeader, FeatureGrid } from "@/components/pages/PublicSections";
import { CONTACT_INFO } from "@/lib/page-data";
import Link from "next/link";

export default function ContactPage() {
  return (
    <PublicPageWrapper>
      <PageHero eyebrow="Support" title="Contact Us" subtitle="Reach the Tasks.cash support council — we respond within 24 hours." variant="gold" />

      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          <MotionReveal>
            <GlassCard className="p-8">
              <h2 className="text-xl font-bold text-white mb-6">Send a Message</h2>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Your name" className="mt-1 border-purple-500/20 bg-purple-950/30" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@email.com" className="mt-1 border-purple-500/20 bg-purple-950/30" />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" className="mt-1 border-purple-500/20 bg-purple-950/30" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <textarea id="message" rows={5} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/40" placeholder="Describe your issue..." />
                </div>
                <PortalButton variant="gold" className="w-full">Send Message</PortalButton>
              </form>
            </GlassCard>
          </MotionReveal>

          <div>
            <SectionHeader centered={false} eyebrow="Reach Us" title="Contact Channels" />
            <div className="space-y-4 mb-10">
              {CONTACT_INFO.map((info) => (
                <GlassCard key={info.label} className="p-5 flex items-center gap-4" hover>
                  <span className="text-3xl">{info.icon}</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-purple-400/60">{info.label}</p>
                    <p className="text-white font-medium">{info.value}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
            <FeatureGrid items={[
              { icon: "❓", title: "FAQ", desc: "Quick answers to common questions.", glow: "purple" },
              { icon: "📚", title: "Help Center", desc: "Detailed guides and tutorials.", glow: "purple" },
            ]} columns={2} />
            <div className="flex gap-4 mt-6">
              <Link href="/faq"><PortalButton variant="secondary" size="sm">View FAQ</PortalButton></Link>
              <Link href="/help"><PortalButton variant="ghost" size="sm">Help Center</PortalButton></Link>
            </div>
          </div>
        </div>
      </div>

      <EpicCTA title="Need Immediate Help?" subtitle="Check our Help Center for instant answers to most questions." primaryHref="/help" primaryLabel="Visit Help Center" secondaryHref="/register" secondaryLabel="Create Account" />
    </PublicPageWrapper>
  );
}
