"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";
import { useContent } from "@/hooks/useContent";

export default function PrivacyPage() {
  const { text } = useContent("main", "privacy");

  return (
    <LegalPage
      eyebrow={text("hero", "eyebrow", "Legal")}
      title={text("hero", "title", "Privacy Policy")}
      subtitle={text("hero", "subtitle", "How we collect, use, and protect your data across dimensions.")}
      sections={LEGAL_SECTIONS.privacy}
    />
  );
}
