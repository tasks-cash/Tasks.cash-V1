"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@tasks-cash/ui";
import { getToken } from "@/lib/api";

const ADMIN_NAV = [
  { href: "/dashboard", label: "Overview", icon: "◈" },
  { href: "/users", label: "Users", icon: "👥" },
  { href: "/users/add", label: "Add User", icon: "➕" },
  { href: "/employees", label: "Employees", icon: "🛡️" },
  { href: "/employees/add", label: "Add Employee", icon: "➕" },
  { href: "/missions", label: "Missions", icon: "⚔️" },
  { href: "/missions/add", label: "Add Mission", icon: "➕" },
  { href: "/mystery-missions", label: "Mystery Missions", icon: "📜" },
  { href: "/mystery-missions/add", label: "Add Mystery", icon: "➕" },
  { href: "/levels", label: "Levels", icon: "⚡" },
  { href: "/levels/add", label: "Add Level", icon: "➕" },
  { href: "/rewards", label: "Rewards", icon: "🎁" },
  { href: "/rewards/add", label: "Add Reward", icon: "➕" },
  { href: "/treasures", label: "Treasures", icon: "💎" },
  { href: "/withdrawals", label: "Withdrawals", icon: "◈" },
  { href: "/referrals", label: "Referrals", icon: "🔗" },
  { href: "/video-submissions", label: "Video Review", icon: "🎥" },
  { href: "/counters", label: "Counters", icon: "📊" },
  { href: "/dna-questions", label: "DNA Questions", icon: "🧬" },
  { href: "/leaderboards", label: "Leaderboards", icon: "🏆" },
  { href: "/challenges", label: "Challenges", icon: "🎯" },
  { href: "/content", label: "Content", icon: "📄" },
  { href: "/notifications", label: "Notifications", icon: "🔔" },
  { href: "/support", label: "Support", icon: "💬" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
  { href: "/audit-logs", label: "Audit Logs", icon: "📋" },
  { href: "/roles", label: "Roles", icon: "🔐" },
  { href: "/permissions", label: "Permissions", icon: "🔑" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { if (!getToken()) router.push("/"); }, [router]);

  return (
    <div className="min-h-screen flex w-full bg-black">
      <AdminSidebar
        items={ADMIN_NAV}
        pathname={pathname}
        onLogout={() => { localStorage.removeItem("tc_token"); router.push("/"); }}
      />
      <div className="flex-1 min-w-0 relative z-10">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
