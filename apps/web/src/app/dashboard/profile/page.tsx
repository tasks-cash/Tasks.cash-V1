"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  ProfileCard,
  RPGStatBar,
  AchievementCard,
  BadgeCard,
  GlassCard,
  GameButton,
} from "@tasks-cash/ui";
import { useGame } from "@/components/game/GameProvider";
import { apiFetch } from "@/lib/api";
import { ACHIEVEMENTS, BADGES } from "@tasks-cash/utils";
import type { RPGStatType } from "@tasks-cash/types";

export default function ProfilePage() {
  const { profile, refresh } = useGame();
  const [username, setUsername] = useState("");

  useEffect(() => {
    refresh();
    const user = localStorage.getItem("tc_user");
    if (user) setUsername(JSON.parse(user).username ?? "");
  }, [refresh]);

  const unlockedAchievements = new Set(profile?.achievements.map((a) => a.id) ?? []);
  const earnedBadges = new Set(profile?.badges.map((b) => b.id) ?? []);

  return (
    <div>
      <PageHeader
        title="Explorer Profile"
        subtitle="Avatar, title, rank, stats, badges, and achievements."
        badge="Profile System"
      />

      {profile ? (
        <ProfileCard profile={profile} className="mb-8" />
      ) : (
        <GlassCard className="p-8 mb-8 text-center">
          <p className="text-6xl mb-4">⚔️</p>
          <h2 className="text-2xl font-black text-white">{username || "Portal Warrior"}</h2>
          <p className="text-purple-400/60 mt-2">Login to sync your profile</p>
        </GlassCard>
      )}

      {profile && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {(Object.keys(profile.rpgStats) as RPGStatType[]).map((stat) => (
              <RPGStatBar key={stat} stat={stat} data={profile.rpgStats[stat]} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Achievements</h2>
              <div className="grid gap-3">
                {ACHIEVEMENTS.map((a) => (
                  <AchievementCard
                    key={a.id}
                    achievement={a}
                    unlocked={unlockedAchievements.has(a.id)}
                    unlockedAt={profile.achievements.find((x) => x.id === a.id)?.unlockedAt}
                  />
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Badge Collection</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BADGES.map((b) => (
                  <BadgeCard key={b.id} badge={b} earned={earnedBadges.has(b.id)} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
