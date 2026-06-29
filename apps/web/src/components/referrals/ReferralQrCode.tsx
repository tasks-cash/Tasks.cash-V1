"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { PortalButton } from "@tasks-cash/ui";

interface ReferralQrCodeProps {
  referralLink: string;
  referralCode: string;
}

export function ReferralQrCode({ referralLink, referralCode }: ReferralQrCodeProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      alert(`${label} copied`);
    } catch {
      alert("Copy failed — please copy manually");
    }
  }

  function downloadQr() {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `tasks-cash-referral-${referralCode}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function shareQr() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Tasks.cash",
          text: `Use my invite code ${referralCode}`,
          url: referralLink,
        });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copyText(referralLink, "Referral link");
  }

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
      <div ref={canvasRef} className="mx-auto rounded-2xl border border-amber-400/25 bg-white p-4 shadow-glow-gold">
        <QRCodeCanvas value={referralLink} size={180} bgColor="#ffffff" fgColor="#1a1033" level="M" includeMargin={false} />
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-purple-400/60">Scan to register with your invite</p>
        <div className="flex flex-wrap gap-2">
          <PortalButton variant="gold" size="sm" onClick={() => copyText(referralCode, "Referral code")}>
            Copy Code
          </PortalButton>
          <PortalButton variant="secondary" size="sm" onClick={() => copyText(referralLink, "Referral link")}>
            Copy Link
          </PortalButton>
          <PortalButton variant="secondary" size="sm" onClick={downloadQr}>
            Download QR
          </PortalButton>
          <PortalButton variant="secondary" size="sm" onClick={shareQr}>
            Share QR
          </PortalButton>
        </div>
        <p className="text-sm text-purple-300/55 break-all">{referralLink}</p>
      </div>
    </div>
  );
}
