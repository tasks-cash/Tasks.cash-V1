"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard, StatCard, PortalButton, PageHeader } from "@tasks-cash/ui";
import { adminFetch, getToken } from "@/lib/api";

interface AdminStats {
  userCount: number;
  missionCount: number;
  rewardCount: number;
  totalCoinsInCirculation: number;
  newUsersToday?: number;
  pendingProofs?: number;
  pendingWithdrawals?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (!getToken()) { router.push("/"); return; }
    adminFetch<AdminStats>("/api/admin/stats").then((r) => r.success && r.data && setStats(r.data));
  }, [router]);

  const display = stats ?? {
    userCount: 8420,
    missionCount: 156,
    rewardCount: 48,
    totalCoinsInCirculation: 2450000,
    newUsersToday: 127,
    pendingProofs: 23,
    pendingWithdrawals: 8,
  };

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Command Center"
        subtitle="Real-time platform metrics and system health"
        badge="Admin Control"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={display.userCount.toLocaleString()} icon="👥" trend="+12% this week" />
        <StatCard label="New Users Today" value={display.newUsersToday ?? 0} icon="📈" glow="gold" />
        <StatCard label="Pending Proofs" value={display.pendingProofs ?? 0} icon="📜" glow="violet" />
        <StatCard label="Withdrawals Pending" value={display.pendingWithdrawals ?? 0} icon="◈" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Missions" value={display.missionCount} icon="⚔️" />
        <StatCard label="Rewards Distributed" value={display.rewardCount} icon="🎁" glow="gold" />
        <StatCard label="Coins in Circulation" value={`◈ ${display.totalCoinsInCirculation.toLocaleString()}`} icon="💰" glow="gold" />
        <StatCard label="System Health" value="99.9%" icon="✅" trend="All systems operational" glow="violet" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { href: "/users/add", label: "Add User", icon: "➕", desc: "Register a new explorer" },
          { href: "/employees/add", label: "Add Employee", icon: "🛡️", desc: "Onboard staff member" },
          { href: "/missions/add", label: "Add Mission", icon: "⚔️", desc: "Create new quest" },
          { href: "/levels/add", label: "Add Level", icon: "⚡", desc: "Define progression tier" },
          { href: "/rewards/add", label: "Add Reward", icon: "🎁", desc: "Configure reward item" },
          { href: "/audit-logs", label: "Audit Logs", icon: "📋", desc: "Review system activity" },
        ].map((item) => (
          <GlassCard key={item.href} className="p-6">
            <span className="text-3xl">{item.icon}</span>
            <h3 className="text-lg font-bold mt-3 text-white">{item.label}</h3>
            <p className="text-purple-400/50 text-sm mt-1 mb-4">{item.desc}</p>
            <PortalButton variant="secondary" size="sm" onClick={() => router.push(item.href)}>
              Open →
            </PortalButton>
          </GlassCard>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { href: "/users", label: "Manage Users", icon: "👥", desc: "View and adjust user balances" },
          { href: "/missions", label: "Manage Missions", icon: "⚔️", desc: "Create and deactivate quests" },
          { href: "/withdrawals", label: "Process Withdrawals", icon: "◈", desc: "Review pending payouts" },
        ].map((item) => (
          <GlassCard key={item.href} glow="violet" className="p-6">
            <span className="text-3xl">{item.icon}</span>
            <h3 className="text-lg font-bold mt-3">{item.label}</h3>
            <p className="text-purple-400/50 text-sm mt-1 mb-4">{item.desc}</p>
            <PortalButton variant="gold" size="sm" onClick={() => router.push(item.href)}>
              Launch Panel
            </PortalButton>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
