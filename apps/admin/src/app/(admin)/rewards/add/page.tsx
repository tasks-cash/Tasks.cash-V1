"use client";

import { GlassCard, GlowText, PortalButton, Input, Label, StatWidget } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><GlowText as="h1" className="text-3xl">Add Reward</GlowText><p className="text-purple-300/60 mt-1">Admin control panel</p></div>
        
      </div>
      
      <GlassCard className="p-8 max-w-2xl"><form className="grid gap-4" onSubmit={(e) => e.preventDefault()}><div><Label>Title / Name</Label><Input className="mt-1" /></div><div><Label>Description</Label><textarea className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white min-h-[100px]" /></div><PortalButton variant="gold">Save</PortalButton></form></GlassCard>
    </div>
  );
}
