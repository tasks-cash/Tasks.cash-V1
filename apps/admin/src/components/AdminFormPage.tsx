"use client";

import Link from "next/link";
import { AdminPageShell } from "@/components/AdminPageShell";
import { GlassCard, PortalButton, Input, Label } from "@tasks-cash/ui";

interface AdminFormPageProps {
  title: string;
  subtitle?: string;
  backHref: string;
  fields: { name: string; label: string; type?: "text" | "email" | "number" | "textarea" | "select"; options?: string[]; defaultValue?: string }[];
  submitLabel?: string;
}

export function AdminFormPage({ title, subtitle, backHref, fields, submitLabel = "Save" }: AdminFormPageProps) {
  return (
    <AdminPageShell
      title={title}
      subtitle={subtitle}
      action={
        <Link href={backHref}>
          <PortalButton variant="ghost" size="sm">← Back</PortalButton>
        </Link>
      }
    >
      <GlassCard className="p-8 max-w-2xl">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {fields.map((field) => (
            <div key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  defaultValue={field.defaultValue}
                  className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white min-h-[100px] resize-none"
                />
              ) : field.type === "select" ? (
                <select id={field.name} defaultValue={field.defaultValue} className="mt-1 w-full rounded-xl border border-purple-500/20 bg-purple-950/30 px-4 py-3 text-white text-sm">
                  {field.options?.map((opt) => <option key={opt}>{opt}</option>)}
                </select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type ?? "text"}
                  defaultValue={field.defaultValue}
                  className="mt-1 border-purple-500/20 bg-purple-950/30"
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <PortalButton variant="gold">{submitLabel}</PortalButton>
            <Link href={backHref}><PortalButton variant="ghost">Cancel</PortalButton></Link>
          </div>
        </form>
      </GlassCard>
    </AdminPageShell>
  );
}
