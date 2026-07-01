"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameHubLayout } from "@/components/hub/GameHubLayout";
import { GlassCard, GameButton } from "@tasks-cash/ui";
import { UNLOCK_CONDITIONS } from "@/data/mystery-vault-data";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type VaultItemApi = {
  id: string;
  name: string;
  rarity?: string;
  description?: string;
  rewardPreview?: string;
  revealed?: boolean;
};

export function MysteryVaultPage() {
  const [items, setItems] = useState<VaultItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revealedId, setRevealedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await apiFetch<{ items: VaultItemApi[] }>("/api/vault");
      if (res.success && res.data) {
        setItems(res.data.items ?? []);
      } else {
        setError(res.error ?? "Failed to load vault");
      }
      setLoading(false);
    }
    load();
  }, []);

  const locked = items.filter((m) => !m.revealed);
  const revealedItem = items.find((m) => m.id === revealedId);

  return (
    <GameHubLayout
      breadcrumb="Hub · Mystery Vault"
      eyebrow="Hidden Realm"
      title="MYSTERY VAULT"
      subtitle="Hidden missions, secret maps, locked rewards, and unknown paths."
    >
      {loading && <p className="text-purple-400/50 text-sm mb-6">Loading vault…</p>}
      {error && !loading && <p className="text-amber-400 text-sm mb-6">{error}</p>}

      <section className="mb-10">
        <h3 className="text-lg font-black text-white mb-4">Locked Mysteries</h3>
        {locked.length === 0 && !loading ? (
          <GlassCard className="p-8 text-center text-purple-400/60">No vault items available yet.</GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {locked.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <GlassCard glow="purple" className="mystery-locked-card p-5 text-center h-full">
                  <span className="text-4xl block mb-3 opacity-60">🔒</span>
                  <p className="font-black text-purple-300/70 mb-2">{m.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-purple-400/40">{m.rarity ?? "Mystery"}</p>
                  {m.description && <p className="text-xs text-purple-300/50 mt-3">{m.description}</p>}
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h3 className="text-lg font-black text-white mb-4">Unlock Conditions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {UNLOCK_CONDITIONS.map((c) => (
            <GlassCard key={c.id} glow={c.met ? "gold" : "purple"} className={cn("p-4 flex items-center gap-3", c.met && "border-emerald-400/25")}>
              <span className={cn("text-lg", c.met ? "text-emerald-400" : "text-purple-500/50")}>{c.met ? "✓" : "○"}</span>
              <span className={cn("text-sm", c.met ? "text-white" : "text-purple-400/50")}>{c.label}</span>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-black text-white mb-4">Mystery Reveal</h3>
        <GlassCard glow="gold" className="p-6 md:p-8 text-center">
          <AnimatePresence mode="wait">
            {!revealedItem ? (
              <motion.div key="locked" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <span className="text-6xl block mb-4 opacity-40">❓</span>
                <p className="text-purple-300/50 mb-6">A mystery awaits those who meet the vault conditions...</p>
                {locked[0] ? (
                  <GameButton variant="gold" onClick={() => setRevealedId(locked[0].id)}>Reveal Mystery Mission</GameButton>
                ) : (
                  <p className="text-sm text-purple-400/50">No mysteries to reveal yet.</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span
                  className="text-6xl block mb-4"
                  animate={{ scale: [1, 1.15, 1], filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🔮
                </motion.span>
                <h4 className="text-2xl font-black text-amber-400 mb-2">{revealedItem.name}</h4>
                <p className="text-purple-300/60 mb-3 max-w-md mx-auto">{revealedItem.description ?? "—"}</p>
                <p className="text-sm font-bold text-emerald-400">{revealedItem.rewardPreview ?? "—"}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </section>
    </GameHubLayout>
  );
}
