"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionShell, GlowCard } from "@/components/ui/GlowCard";
import { ArenaButton } from "@/components/ui/ArenaButton";
import { ReferralQrPanel } from "@/components/referral-arena/ReferralQrPanel";
import { apiFetch } from "@/lib/api/client";
import { buildReferralLink, formatRewardCoins, REFERRAL_STATUS_LABELS } from "@/lib/referrals";
import { buildMainLoginUrl } from "@/lib/auth/redirect";
import type {
  ReferralLeaderboardChampion,
  ReferralLeaderboardsResponse,
  ReferralMeResponse,
  ReferralRecord,
} from "@/types/referrals";
import { cn } from "@/lib/utils";

type Period = "daily" | "weekly" | "monthly";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "daily", label: "Daily Champions" },
  { key: "weekly", label: "Weekly Champions" },
  { key: "monthly", label: "Monthly Champions" },
];

function StatTile({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <GlowCard glow="violet" hover={false} className="p-4 md:p-5">
      <p className="text-[10px] uppercase tracking-[0.25em] text-purple-400/50 font-bold mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className="text-2xl md:text-3xl font-black text-white tabular-nums">{value}</p>
        <span className="text-2xl opacity-80">{icon}</span>
      </div>
    </GlowCard>
  );
}

function ChampionCard({ entry, index }: { entry: ReferralLeaderboardChampion; index: number }) {
  return (
    <GlowCard glow={index === 0 ? "gold" : "violet"} className={cn("p-6 md:p-8", index === 0 && "md:scale-[1.02]")}>
      <div className="flex items-center gap-4 mb-4">
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl font-black",
            index === 0 ? "border-amber-400 text-amber-400 bg-amber-950/40" : "border-purple-500/40 text-purple-300"
          )}
        >
          #{entry.rank}
        </span>
        <div className="min-w-0">
          <p className="font-black text-white text-lg md:text-xl truncate">{entry.username}</p>
          <p className="text-purple-400/60 text-sm">{entry.referrals} referrals</p>
        </div>
      </div>
      <p className="text-amber-400 font-black text-2xl md:text-3xl">{formatRewardCoins(entry.rewardCoins)}</p>
    </GlowCard>
  );
}

export function ReferralArenaSection() {
  const [me, setMe] = useState<ReferralMeResponse | null>(null);
  const [history, setHistory] = useState<ReferralRecord[]>([]);
  const [leaderboards, setLeaderboards] = useState<ReferralLeaderboardsResponse | null>(null);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const [meRes, historyRes, boardsRes] = await Promise.all([
        apiFetch<ReferralMeResponse>("/api/referrals/me"),
        apiFetch<ReferralRecord[]>("/api/referrals/history"),
        apiFetch<ReferralLeaderboardsResponse>("/api/referrals/leaderboards"),
      ]);

      if (!meRes.success) {
        const msg = meRes.error ?? "Failed to load referral profile";
        setError(msg);
        setLoading(false);
        return;
      }

      if (meRes.data) {
        setMe({
          ...meRes.data,
          referralLink: meRes.data.referralLink || buildReferralLink(meRes.data.referralCode),
        });
      }

      if (historyRes.success && historyRes.data) {
        setHistory(historyRes.data);
      } else if (meRes.data?.history) {
        setHistory(meRes.data.history);
      }

      if (boardsRes.success && boardsRes.data) {
        setLeaderboards(boardsRes.data);
      }

      setLoading(false);
    }

    void load();
  }, []);

  const pendingReferrals = useMemo(
    () => history.filter((row) => row.status === "pending").length,
    [history]
  );

  const champions = leaderboards?.[period] ?? [];

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2800);
  }

  if (loading) {
    return (
      <SectionShell
        id="referral-arena"
        eyebrow="Referral War"
        title="Referral Arena"
        subtitle="Loading your portal invite command center…"
        minHeight={false}
        className="!min-h-0 py-16 md:py-24"
      >
        <GlowCard glow="purple" hover={false} className="p-12 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin" />
          <p className="text-purple-300/60 text-sm">Syncing referral intelligence from the database…</p>
        </GlowCard>
      </SectionShell>
    );
  }

  if (error) {
    const isAuthError =
      error.toLowerCase().includes("unauthorized") || error.toLowerCase().includes("invalid token");
    const loginUrl = buildMainLoginUrl(typeof window !== "undefined" ? window.location.href : "/referral-arena");
    return (
      <SectionShell
        id="referral-arena"
        eyebrow="Referral War"
        title="Referral Arena"
        subtitle={
          isAuthError
            ? "Authenticate to access your referral command center."
            : "Referral data is temporarily unavailable."
        }
        minHeight={false}
        className="!min-h-0 py-16 md:py-24"
      >
        <GlowCard glow="gold" hover={false} className="p-8 md:p-10 text-center max-w-2xl">
          <p className="text-red-300 text-sm mb-4">{error}</p>
          {isAuthError ? (
            <ArenaButton variant="gold" size="lg" type="button" onClick={() => { window.location.href = loginUrl; }}>
              Sign In to Continue
            </ArenaButton>
          ) : (
            <ArenaButton variant="purple" size="lg" type="button" onClick={() => window.location.reload()}>
              Retry
            </ArenaButton>
          )}
        </GlowCard>
      </SectionShell>
    );
  }

  const stats = me ?? {
    referralCode: "",
    referralLink: "",
    totalInvites: 0,
    activeReferrals: 0,
    pendingRewards: 0,
    earnedRewards: 0,
  };

  return (
    <SectionShell
      id="referral-arena"
      eyebrow="Referral War"
      title="Referral Arena"
      subtitle="Recruit allies into the portal. Track invites, earn rewards, and climb daily, weekly, and monthly champion boards."
      minHeight={false}
      className="!min-h-0 py-12 md:py-20"
    >
      {toast && (
        <p className="mb-6 rounded-xl border border-emerald-400/30 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-300">
          {toast}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
        <StatTile label="Total Invited" value={stats.totalInvites} icon="🔗" />
        <StatTile label="Active Referrals" value={stats.activeReferrals} icon="⚡" />
        <StatTile label="Pending Referrals" value={pendingReferrals} icon="⏳" />
        <StatTile label="Pending Rewards" value={formatRewardCoins(stats.pendingRewards)} icon="🎁" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-14">
        <GlowCard glow="gold" className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/60 font-bold mb-3">Your Referral Code</p>
            <p className="text-3xl md:text-4xl font-black text-amber-300 tracking-widest mb-6 break-all">
              {stats.referralCode || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-amber-400/20 bg-black/30 p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-purple-400/50 font-bold mb-2">Earned Rewards</p>
            <p className="text-2xl font-black text-amber-300">{formatRewardCoins(stats.earnedRewards)}</p>
          </div>
        </GlowCard>

        <GlowCard glow="violet" className="p-6 md:p-8">
          <ReferralQrPanel
            referralCode={stats.referralCode}
            referralLink={stats.referralLink}
            onToast={showToast}
          />
        </GlowCard>
      </div>

      <div className="mb-10 md:mb-14">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <h3 className="text-xl md:text-2xl font-black text-white">Referral History</h3>
        </div>

        <GlowCard glow="purple" hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-purple-400/50 border-b border-purple-500/20">
                  <th className="px-5 py-4 font-bold">Invited User</th>
                  <th className="px-5 py-4 font-bold">Date</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Reward</th>
                  <th className="px-5 py-4 font-bold">Admin Note</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-purple-400/50">
                      No referrals yet — share your invite link to recruit your first ally.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => {
                    const status = REFERRAL_STATUS_LABELS[row.status];
                    return (
                      <tr key={row.id} className="border-b border-purple-500/10 hover:bg-purple-950/20">
                        <td className="px-5 py-4 text-white font-medium">
                          {row.referredUser?.username ?? "Explorer"}
                        </td>
                        <td className="px-5 py-4 text-purple-300/70 whitespace-nowrap">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                              status.className
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-amber-300 font-semibold">
                          {formatRewardCoins(row.rewardCoins ?? 0)}
                          {(row.rewardXp ?? 0) > 0 ? ` · ${row.rewardXp} XP` : ""}
                        </td>
                        <td className="px-5 py-4 text-purple-300/60 max-w-[220px]">{row.adminNote ?? "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </GlowCard>
      </div>

      <div>
        <h3 className="text-xl md:text-2xl font-black text-white mb-6">Referral Leaderboards</h3>

        <div className="flex flex-wrap gap-3 mb-8">
          {PERIOD_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPeriod(tab.key)}
              className={cn(
                "rounded-xl border px-5 py-3 text-xs md:text-sm font-bold uppercase tracking-wider transition-all",
                period === tab.key
                  ? "border-amber-400/50 bg-amber-950/40 text-amber-300 shadow-glow-gold"
                  : "border-purple-500/25 bg-black/40 text-purple-400/60 hover:border-purple-400/40"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="grid w-full grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          >
            {champions.length === 0 ? (
              <GlowCard glow="purple" hover={false} className="md:col-span-3 p-10 text-center text-purple-400/50">
                No champions yet for this period — be the first to recruit allies.
              </GlowCard>
            ) : (
              champions.slice(0, 3).map((entry, index) => (
                <ChampionCard key={`${period}-${entry.userId}`} entry={entry} index={index} />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </SectionShell>
  );
}
