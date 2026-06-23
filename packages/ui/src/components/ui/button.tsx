import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-purple-600 text-white shadow-glow-purple hover:bg-purple-500",
        gold: "bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-glow-gold hover:from-amber-300 hover:to-yellow-400",
        secondary:
          "border border-purple-500/30 bg-purple-950/50 text-purple-100 hover:border-purple-400/50 hover:bg-purple-900/50",
        ghost: "text-purple-200 hover:bg-purple-950/50 hover:text-white",
        destructive: "bg-red-600 text-white hover:bg-red-500",
        outline:
          "border border-purple-500/30 bg-transparent text-purple-100 hover:bg-purple-950/40",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
