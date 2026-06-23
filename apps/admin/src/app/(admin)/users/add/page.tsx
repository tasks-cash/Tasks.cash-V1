"use client";

import { AdminFormPage } from "@/components/AdminFormPage";

export default function AddUserPage() {
  return (
    <AdminFormPage
      title="Add User"
      subtitle="Create a new portal explorer account"
      backHref="/users"
      fields={[
        { name: "username", label: "Username" },
        { name: "email", label: "Email", type: "email" },
        { name: "password", label: "Password", type: "text" },
        { name: "coins", label: "Starting Coins", type: "number", defaultValue: "0" },
        { name: "level", label: "Starting Level", type: "number", defaultValue: "1" },
      ]}
      submitLabel="Create User"
    />
  );
}
