"use client";

import { LegalPage } from "@/components/pages/LegalPage";
import { LEGAL_SECTIONS } from "@/lib/page-data";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your data across dimensions."
      sections={LEGAL_SECTIONS.privacy}
    />
  );
}
