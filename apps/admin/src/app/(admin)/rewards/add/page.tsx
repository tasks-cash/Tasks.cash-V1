"use client";

import { AdminFormPage } from "@/components/AdminFormPage";

export default function AddRewardPage() {
  return (
    <AdminFormPage
      title="Add Reward"
      subtitle="Create a new reward item"
      backHref="/rewards"
      fields={[
        { name: "name", label: "Reward Name" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "type", label: "Type", type: "select", options: ["daily", "mission", "challenge", "referral", "treasure", "rank"] },
        { name: "amount", label: "Reward Amount" },
        { name: "tier", label: "Tier", type: "select", options: ["common", "rare", "epic", "gold", "legendary"] },
      ]}
      submitLabel="Create Reward"
    />
  );
}
