"use client";

import Link from "next/link";
import { AdminPageShell, AdminTable } from "@/components/AdminPageShell";
import { PortalButton } from "@tasks-cash/ui";

const BLOG_POSTS = [
  { id: "b1", title: "Portal Genesis", category: "Announcements", status: "published", date: "Jun 15" },
  { id: "b2", title: "Weekly Challenges Guide", category: "Guides", status: "published", date: "Jun 10" },
  { id: "b3", title: "Treasure System Deep Dive", category: "Guides", status: "published", date: "Jun 5" },
  { id: "b4", title: "Q3 Roadmap Update", category: "Announcements", status: "draft", date: "May 20" },
];

export default function AdminContentPage() {
  return (
    <AdminPageShell
      title="Content Management"
      subtitle="Manage blog posts and portal content"
      action={<PortalButton variant="gold" size="sm">+ New Post</PortalButton>}
      stats={[
        { label: "Published", value: BLOG_POSTS.filter((p) => p.status === "published").length, icon: "📄", glow: "gold" },
        { label: "Drafts", value: BLOG_POSTS.filter((p) => p.status === "draft").length, icon: "📝" },
        { label: "Categories", value: 3, icon: "📁" },
        { label: "Total Views", value: "48K", icon: "👁️" },
      ]}
    >
      <AdminTable
        headers={["ID", "Title", "Category", "Status", "Date", "Actions"]}
        rows={BLOG_POSTS.map((p) => [
          p.id,
          p.title,
          p.category,
          <span key={p.id} className={p.status === "published" ? "text-green-400" : "text-amber-400"}>{p.status}</span>,
          p.date,
          <div key={`actions-${p.id}`} className="flex gap-2">
            <PortalButton variant="ghost" size="sm">Edit</PortalButton>
            <Link href={`/blog/${p.id}`} target="_blank"><PortalButton variant="ghost" size="sm">View</PortalButton></Link>
          </div>,
        ])}
      />
    </AdminPageShell>
  );
}
