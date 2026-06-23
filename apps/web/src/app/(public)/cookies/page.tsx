"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      subtitle="How we use cookies and similar technologies in the portal."
      sections={LEGAL_SECTIONS.cookies}
    />
  );
}
