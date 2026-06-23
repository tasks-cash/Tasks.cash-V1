"use client";

import React from "react";
import { GameButton } from "./GameButton";

interface PortalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  pulse?: boolean;
}

/** Premium portal-themed button — wraps GameButton for backward compatibility */
export function PortalButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  pulse = false,
  className = "",
  disabled,
  ...props
}: PortalButtonProps) {
  const mappedVariant =
    variant === "gold" ? "gold" : variant === "primary" ? "purple" : variant;

  return (
    <GameButton
      variant={mappedVariant}
      size={size}
      loading={loading}
      pulse={pulse}
      className={className}
      disabled={disabled}
      {...props}
    >
      {children}
    </GameButton>
  );
}
