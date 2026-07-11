"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";
import { useContent } from "@/hooks/useContent";

export default function CookiePolicyPage() {
  const { text } = useContent("main", "cookies");

  return (
    <LegalPage
      eyebrow={text("hero", "eyebrow", "Legal")}
      title={text("hero", "title", "Cookie Policy")}
      subtitle={text("hero", "subtitle", "How we use cookies and similar technologies in the portal.")}
      sections={LEGAL_SECTIONS.cookies}
    />
  );
}
