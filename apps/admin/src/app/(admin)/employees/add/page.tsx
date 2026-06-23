"use client";

import { AdminFormPage } from "@/components/AdminFormPage";

export default function AddEmployeePage() {
  return (
    <AdminFormPage
      title="Add Employee"
      subtitle="Add a new staff member"
      backHref="/employees"
      fields={[
        { name: "name", label: "Full Name" },
        { name: "email", label: "Email", type: "email" },
        { name: "role", label: "Role", type: "select", options: ["Admin", "Moderator", "Support", "Analyst"] },
        { name: "department", label: "Department", type: "select", options: ["Operations", "Community", "Support", "Analytics"] },
      ]}
      submitLabel="Add Employee"
    />
  );
}
