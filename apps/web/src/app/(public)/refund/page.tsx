"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Refund Policy"
      subtitle="Guidelines for virtual purchases and withdrawal disputes."
      sections={LEGAL_SECTIONS.refund}
    />
  );
}
