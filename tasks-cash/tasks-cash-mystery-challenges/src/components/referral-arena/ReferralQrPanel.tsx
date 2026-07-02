"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { ArenaButton } from "@/components/ui/ArenaButton";

interface ReferralQrPanelProps {
  referralLink: string;
  referralCode: string;
  onToast: (message: string) => void;
}

export function ReferralQrPanel({ referralLink, referralCode, onToast }: ReferralQrPanelProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      onToast(`${label} copied`);
    } catch {
      onToast("Copy failed — please copy manually");
    }
  }

  function downloadQr() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `referral-${referralCode || "code"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    onToast("QR code downloaded");
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Tasks.cash",
          text: `Use my invite code ${referralCode}`,
          url: referralLink,
        });
        return;
      } catch {
        /* cancelled */
      }
    }
    await copyText(referralLink, "Referral link");
  }

  if (!referralCode) {
    return (
      <div className="rounded-2xl border border-purple-500/20 bg-black/40 p-8 text-center text-purple-400/50 text-sm">
        Sign in to generate your referral code and QR.
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[minmax(200px,240px)_1fr] gap-6 md:gap-8 items-start">
      <div
        ref={canvasRef}
        className="mx-auto rounded-2xl border border-amber-400/30 bg-white p-4 shadow-glow-gold"
      >
        <QRCodeCanvas value={referralLink} size={200} bgColor="#ffffff" fgColor="#1a1033" level="M" />
      </div>

      <div className="space-y-4 min-w-0">
        <p className="text-[10px] uppercase tracking-[0.3em] text-purple-400/50 font-bold">Portal Invite QR</p>
        <p className="text-sm text-purple-200/60 break-all font-mono">{referralLink}</p>
        <div className="flex flex-wrap gap-2">
          <ArenaButton variant="gold" size="md" type="button" onClick={() => copyText(referralCode, "Referral code")}>
            Copy Code
          </ArenaButton>
          <ArenaButton variant="purple" size="md" type="button" onClick={() => copyText(referralLink, "Referral link")}>
            Copy Link
          </ArenaButton>
          <ArenaButton variant="ghost" size="md" type="button" onClick={downloadQr}>
            Download QR
          </ArenaButton>
          <ArenaButton variant="ghost" size="md" type="button" onClick={shareLink}>
            Share Link
          </ArenaButton>
        </div>
      </div>
    </div>
  );
}
