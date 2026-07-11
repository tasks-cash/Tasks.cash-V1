"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";
import { useContent } from "@/hooks/useContent";

export default function RefundPolicyPage() {
  const { text } = useContent("main", "refund");

  return (
    <LegalPage
      eyebrow={text("hero", "eyebrow", "Legal")}
      title={text("hero", "title", "Refund Policy")}
      subtitle={text("hero", "subtitle", "Guidelines for virtual purchases and withdrawal disputes.")}
      sections={LEGAL_SECTIONS.refund}
    />
  );
}
