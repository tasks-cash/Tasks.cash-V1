"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="Rules governing your journey through the portal."
      sections={LEGAL_SECTIONS.terms}
    />
  );
}
