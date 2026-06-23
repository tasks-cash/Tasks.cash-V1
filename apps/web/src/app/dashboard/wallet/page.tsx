"use client";

import { useEffect, useState } from "react";
import {
  PageHeader,
  CurrencyWallet,
  GlassCard,
  GameButton,
  StatCard,
} from "@tasks-cash/ui";
import { useGame } from "@/components/game/GameProvider";
import { apiFetch } from "@/lib/api";
import type { ICurrencies } from "@tasks-cash/types";
import { CURRENCY_META } from "@tasks-cash/utils";

export default function WalletPage() {
  const { profile, refresh } = useGame();
  const [currencies, setCurrencies] = useState<ICurrencies | null>(null);
  const [exchangeMsg, setExchangeMsg] = useState("");

  useEffect(() => {
    apiFetch<{ currencies: ICurrencies; transactions: unknown[] }>("/api/users/wallet").then((res) => {
      if (res.success && res.data?.currencies) setCurrencies(res.data.currencies);
    });
    refresh();
  }, [refresh]);

  const display = profile?.currencies ?? currencies ?? {
    bronze: 2450,
    silver: 120,
    gold: 15,
    diamonds: 8,
    crystals: 24,
    legendTokens: 2,
    mythicCoins: 0,
    portalEnergy: 85,
  };

  async function handleExchange(from: keyof ICurrencies, to: keyof ICurrencies) {
    setExchangeMsg("");
    const res = await apiFetch("/api/game/currency/exchange", {
      method: "POST",
      body: JSON.stringify({ from, to, amount: 100 }),
    });
    if (res.success) {
      setExchangeMsg(`Exchanged 100 ${from} → ${to}`);
      await refresh();
    } else {
      setExchangeMsg(res.error ?? "Exchange failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Multi-Currency Wallet"
        subtitle="Bronze, silver, gold, gems, crystals, tokens, and portal energy."
        badge="Economy System"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Bronze" value={display.bronze.toLocaleString()} icon="🟤" glow="gold" />
        <StatCard label="Diamonds" value={display.diamonds} icon="💎" glow="violet" />
        <StatCard label="Portal Energy" value={display.portalEnergy} icon="⚡" />
        <StatCard label="Mythic Coins" value={display.mythicCoins} icon="✨" glow="gold" />
      </div>

      <GlassCard className="p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">All Currencies</h2>
        <CurrencyWallet currencies={display} />
      </GlassCard>

      <GlassCard glow="violet" className="p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Currency Exchange</h2>
        <p className="text-purple-300/60 text-sm mb-4">Convert between portal currencies at live rates.</p>
        <div className="flex flex-wrap gap-3">
          <GameButton variant="secondary" size="sm" onClick={() => handleExchange("bronze", "silver")}>
            100 Bronze → Silver
          </GameButton>
          <GameButton variant="secondary" size="sm" onClick={() => handleExchange("silver", "gold")}>
            100 Silver → Gold
          </GameButton>
          <GameButton variant="gold" size="sm" onClick={() => handleExchange("gold", "diamonds")}>
            100 Gold → Diamonds
          </GameButton>
        </div>
        {exchangeMsg && <p className="text-sm text-emerald-400 mt-3">{exchangeMsg}</p>}
        <div className="mt-6 grid sm:grid-cols-2 gap-2 text-xs text-purple-400/50">
          {(Object.keys(CURRENCY_META) as (keyof ICurrencies)[]).map((k) => (
            <p key={k}>{CURRENCY_META[k].icon} {CURRENCY_META[k].label} — rate ×{CURRENCY_META[k].exchangeRate}</p>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
