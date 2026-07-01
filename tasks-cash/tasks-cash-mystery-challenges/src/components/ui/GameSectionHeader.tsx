"use client";

interface GameSectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}

/** Shared section header — typography hierarchy for all game pages */
export function GameSectionHeader({ eyebrow, title, subtitle, className = "", centered = false }: GameSectionHeaderProps) {
  return (
    <div className={`game-section-header ${centered ? "text-center" : ""} ${className}`.trim()}>
      {eyebrow && <p className="game-eyebrow mb-3">{eyebrow}</p>}
      <h2 className="section-title glow-purple">{title}</h2>
      {subtitle && <p className={`game-desc mt-4 max-w-3xl text-lg ${centered ? "mx-auto" : ""}`}>{subtitle}</p>}
      <div className={`portal-divider mt-8 max-w-xs opacity-50 ${centered ? "mx-auto" : ""}`} />
    </div>
  );
}

export { GameSectionHeader as SectionHeader };
