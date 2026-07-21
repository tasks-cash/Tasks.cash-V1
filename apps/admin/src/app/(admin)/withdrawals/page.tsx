"use client";

import { GlassCard, GlowText, PortalButton, Input, Label, StatWidget } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><GlowText as="h1" className="text-3xl">Withdrawals Management</GlowText><p className="text-purple-300/60 mt-1">Admin control panel</p></div>
        <PortalButton variant="gold" size="sm">+ Add New</PortalButton>
      </div>
      
      <GlassCard className="p-6 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-purple-400/60 border-b border-purple-500/20"><th className="pb-3 pr-4">ID</th><th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Status</th><th className="pb-3">Actions</th></tr></thead><tbody>{[1,2,3,4,5].map((i) => (<tr key={i} className="border-b border-purple-500/10"><td className="py-3 pr-4 text-purple-300">#WIT{1000+i}</td><td className="py-3 pr-4 text-white">Sample Entry {i}</td><td className="py-3 pr-4 text-green-400">Active</td><td className="py-3"><PortalButton variant="ghost" size="sm">Edit</PortalButton></td></tr>))}</tbody></table></GlassCard>
    </div>
  );
}
