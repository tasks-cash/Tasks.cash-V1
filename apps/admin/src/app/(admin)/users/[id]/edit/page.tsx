"use client";

import { AdminFormPage } from "@/components/AdminFormPage";

export default function EditUserPage() {
  return (
    <AdminFormPage
      title="Edit User"
      subtitle="Modify explorer account details"
      backHref="/users"
      fields={[
        { name: "username", label: "Username", defaultValue: "VoidKing" },
        { name: "email", label: "Email", type: "email", defaultValue: "void@example.com" },
        { name: "coins", label: "Coins", type: "number", defaultValue: "12400" },
        { name: "level", label: "Level", type: "number", defaultValue: "42" },
        { name: "status", label: "Status", type: "select", options: ["active", "suspended", "inactive"], defaultValue: "active" },
      ]}
      submitLabel="Update User"
    />
  );
}
