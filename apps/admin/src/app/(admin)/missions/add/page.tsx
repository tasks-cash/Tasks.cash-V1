"use client";

import { AdminFormPage } from "@/components/AdminFormPage";

export default function AddMissionPage() {
  return (
    <AdminFormPage
      title="Add Mission"
      subtitle="Create a new portal quest"
      backHref="/missions"
      fields={[
        { name: "title", label: "Mission Title" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "world", label: "World", type: "select", options: ["Void Nexus", "Gold Realm", "Neon Frontier", "Shadow Grove"] },
        { name: "difficulty", label: "Difficulty", type: "select", options: ["Easy", "Medium", "Hard", "Legendary"] },
        { name: "coinReward", label: "Coin Reward", type: "number", defaultValue: "100" },
        { name: "xpReward", label: "XP Reward", type: "number", defaultValue: "250" },
      ]}
      submitLabel="Create Mission"
    />
  );
}
