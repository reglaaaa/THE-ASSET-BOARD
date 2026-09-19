"use client";

import { RotateCw } from "lucide-react";

/**
 * Icon-only refresh control — no border, no text. Tapping it triggers the
 * same rate-limited refresh as before.
 */
export function RefreshStatus({
  onClick,
  isRefreshing,
  isRateLimited,
  cooldownSecondsLeft
}: {
  onClick: () => void;
  isRefreshing: boolean;
  isRateLimited: boolean;
  cooldownSecondsLeft: number;
  lastUpdatedAt?: number | null;
}) {
  const disabled = isRefreshing || isRateLimited;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={isRateLimited ? `Wait ${cooldownSecondsLeft}s to refresh again` : "Refresh"}
      aria-label="Refresh"
      className={`flex h-8 w-8 shrink-0 items-center justify-center transition-colors ${
        disabled ? "cursor-not-allowed text-ink-600" : "text-ink-400 hover:text-gold-300"
      }`}
    >
      <RotateCw size={15} strokeWidth={2.2} className={isRefreshing ? "animate-spin" : ""} />
    </button>
  );
}
