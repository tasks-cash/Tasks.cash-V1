import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-purple-500/30 bg-purple-950/60 text-purple-200",
        gold: "border-amber-400/30 bg-amber-950/40 text-amber-300",
        success: "border-green-500/30 bg-green-950/40 text-green-300",
        destructive: "border-red-500/30 bg-red-950/40 text-red-300",
        outline: "border-purple-500/20 text-purple-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
