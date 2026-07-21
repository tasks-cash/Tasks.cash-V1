"use client";

import { GlassCard, GlowText, StatWidget, PortalButton, Input, Label, LevelBar, NotificationItem } from "@tasks-cash/ui";
import { ADMIN_STATS } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <GlowText as="h1" className="text-3xl">My Level & XP</GlowText>
        <p className="text-purple-300/60 mt-1">Manage your portal journey</p>
      </div>
      <GlassCard className="p-8"><LevelBar level={12} progress={65} title="Void Walker" xpCurrent={6500} xpRequired={10000} /><div className="mt-8 grid grid-cols-2 gap-4"><StatWidget label="Current Level" value="12" icon="⚡" /><StatWidget label="Next Title" value="Gold Warden" icon="👑" glow="gold" /></div></GlassCard>
    </div>
  );
}
