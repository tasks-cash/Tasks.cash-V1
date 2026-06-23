"use client";

import { AdminFormPage } from "@/components/AdminFormPage";

export default function AddLevelPage() {
  return (
    <AdminFormPage
      title="Add Level"
      subtitle="Configure a new XP level tier"
      backHref="/levels"
      fields={[
        { name: "level", label: "Level Number", type: "number" },
        { name: "title", label: "Level Title" },
        { name: "xpRequired", label: "XP Required", type: "number" },
        { name: "reward", label: "Level Reward" },
      ]}
      submitLabel="Create Level"
    />
  );
}
