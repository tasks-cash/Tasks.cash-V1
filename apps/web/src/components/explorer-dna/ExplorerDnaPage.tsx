"use client";

import { useEffect, useState } from "react";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { GlassCard } from "@tasks-cash/ui";
import type { ExplorerDNAData } from "@tasks-cash/types";
import { apiFetch } from "@/lib/api";
import { DnaHelixBackground } from "./DnaHelixBackground";
import { DnaCompletionHero } from "./DnaCompletionHero";
import { DnaModulesPanel } from "./DnaModulesPanel";
import { DnaContinuousQuestions } from "./DnaContinuousQuestions";
import { DnaMatchEngine } from "./DnaMatchEngine";
import { RecommendedForYou } from "./RecommendedForYou";
import { DnaRewards } from "./DnaRewards";

const EMPTY_DNA: ExplorerDNAData = {
  profile: {
    completionPercent: 0,
    completedModules: 0,
    totalModules: 0,
    intelligenceScore: 0,
    nextReward: "",
    pendingQuestions: 0,
    totalXpEarned: 0,
    badges: [],
  },
  modules: [],
  questions: [],
  answers: [],
  matchScores: [],
  recommendations: [],
};

export function ExplorerDnaPage() {
  const [data, setData] = useState<ExplorerDNAData>(EMPTY_DNA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastReward, setLastReward] = useState<{ xp: number; coins: number } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await apiFetch<ExplorerDNAData>("/api/explorer-dna/me");
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error ?? "Failed to load Explorer DNA");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleAnswer(questionId: string, value: string | string[] | number) {
    const res = await apiFetch<{
      xpAwarded: number;
      coinsAwarded: number;
      profile: ExplorerDNAData["profile"];
    }>("/api/explorer-dna/answers", {
      method: "POST",
      body: JSON.stringify({ questionId, value }),
    });

    if (res.success && res.data) {
      setLastReward({ xp: res.data.xpAwarded, coins: res.data.coinsAwarded });
      setData((prev) => ({
        ...prev,
        profile: res.data!.profile,
        questions: prev.questions.map((q) => (q.id === questionId ? { ...q, isNew: false } : q)),
      }));
      return;
    }

    setError(res.error ?? "Failed to submit answer");
  }

  return (
    <div className="relative">
      <DnaHelixBackground />
      <GameHubLayout
        breadcrumb="Core System · Explorer DNA"
        eyebrow="Intelligent Platform Learning"
        title="Explorer DNA"
        subtitle="Build your Explorer DNA. The more we understand your skills, interests, experience, and goals, the better we can recommend missions and rewards designed specifically for you."
      >
        {loading && (
          <GlassCard className="p-6 mb-8 text-center text-purple-400/60">
            Loading your Explorer DNA profile…
          </GlassCard>
        )}
        {error && !loading && (
          <p className="text-amber-300/80 text-sm mb-6 rounded-xl border border-amber-400/20 bg-amber-950/20 px-4 py-3">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <DnaCompletionHero profile={data.profile} />
            <DnaRewards profile={data.profile} lastReward={lastReward} />
            <DnaContinuousQuestions questions={data.questions} onAnswer={handleAnswer} />
            <DnaMatchEngine scores={data.matchScores} />
            <RecommendedForYou recommendations={data.recommendations} />
            <DnaModulesPanel modules={data.modules} />
          </>
        )}
      </GameHubLayout>
    </div>
  );
}
