"use client";

import { AdminFormPage } from "@/components/AdminFormPage";

export default function EditMissionPage() {
  return (
    <AdminFormPage
      title="Edit Mission"
      subtitle="Update mission details and rewards"
      backHref="/missions"
      fields={[
        { name: "title", label: "Mission Title", defaultValue: "Daily Portal Scan" },
        { name: "description", label: "Description", type: "textarea", defaultValue: "Scan the dimensional grid for anomalies." },
        { name: "world", label: "World", type: "select", options: ["Void Nexus", "Gold Realm", "Neon Frontier", "Shadow Grove"], defaultValue: "Void Nexus" },
        { name: "difficulty", label: "Difficulty", type: "select", options: ["Easy", "Medium", "Hard", "Legendary"], defaultValue: "Easy" },
        { name: "coinReward", label: "Coin Reward", type: "number", defaultValue: "50" },
        { name: "xpReward", label: "XP Reward", type: "number", defaultValue: "100" },
      ]}
      submitLabel="Update Mission"
    />
  );
}
