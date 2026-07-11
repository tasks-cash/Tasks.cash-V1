"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";
import { useContent } from "@/hooks/useContent";

export default function TermsPage() {
  const { text } = useContent("main", "terms");

  return (
    <LegalPage
      eyebrow={text("hero", "eyebrow", "Legal")}
      title={text("hero", "title", "Terms of Service")}
      subtitle={text("hero", "subtitle", "Rules governing your journey through the portal.")}
      sections={LEGAL_SECTIONS.terms}
    />
  );
}
