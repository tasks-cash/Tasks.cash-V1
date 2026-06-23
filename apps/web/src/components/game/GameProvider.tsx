"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { IGameDashboard, IPlayerProfile } from "@tasks-cash/types";
import { GameToastProvider, LevelUpOverlay } from "@tasks-cash/ui";
import { apiFetch, getToken } from "@/lib/api";

interface GameContextValue {
  profile: IPlayerProfile | null;
  dashboard: IGameDashboard | null;
  loading: boolean;
  refresh: () => Promise<void>;
  claimLiveReward: () => Promise<void>;
  claimDailyReward: () => Promise<void>;
  openTreasure: (chestId: string) => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

function GameEngine({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<IPlayerProfile | null>(null);
  const [dashboard, setDashboard] = useState<IGameDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState<{ show: boolean; level: number; title?: string }>({ show: false, level: 0 });
  const prevLevel = useRef(0);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setProfile(null);
      setDashboard(null);
      setLoading(false);
      return;
    }
    try {
      const [profileRes, dashRes] = await Promise.all([
        apiFetch<IPlayerProfile>("/api/game/profile"),
        apiFetch<IGameDashboard>("/api/game/dashboard"),
      ]);
      if (profileRes.success && profileRes.data) {
        if (prevLevel.current > 0 && profileRes.data.globalLevel > prevLevel.current) {
          setLevelUp({ show: true, level: profileRes.data.globalLevel, title: profileRes.data.playerTitle });
          setTimeout(() => setLevelUp({ show: false, level: 0 }), 4000);
        }
        prevLevel.current = profileRes.data.globalLevel;
        setProfile(profileRes.data);
      }
      if (dashRes.success && dashRes.data) setDashboard(dashRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const claimLiveReward = useCallback(async () => {
    await apiFetch("/api/game/live-reward", { method: "POST" });
    await refresh();
  }, [refresh]);

  const claimDailyReward = useCallback(async () => {
    await apiFetch("/api/game/daily-reward", { method: "POST" });
    await refresh();
  }, [refresh]);

  const openTreasure = useCallback(async (chestId: string) => {
    await apiFetch("/api/game/treasure/open", {
      method: "POST",
      body: JSON.stringify({ chestId }),
    });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <GameContext.Provider value={{ profile, dashboard, loading, refresh, claimLiveReward, claimDailyReward, openTreasure }}>
      {children}
      <LevelUpOverlay
        show={levelUp.show}
        level={levelUp.level}
        title={levelUp.title}
        onClose={() => setLevelUp({ show: false, level: 0 })}
      />
    </GameContext.Provider>
  );
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  return (
    <GameToastProvider>
      <GameEngine>{children}</GameEngine>
    </GameToastProvider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
