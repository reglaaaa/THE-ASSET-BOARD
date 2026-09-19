"use client";

import { RefreshCw } from "lucide-react";
import { useRateLimitedRefresh } from "@/lib/useRateLimitedRefresh";

/**
 * Presentational refresh button. Rate-limit state is owned by the caller
 * (via useRateLimitedRefresh) rather than created internally, so a page that
 * also has pull-to-refresh can share the exact same cooldown between both
 * triggers — otherwise each would get its own independent timer and one
 * could be used to bypass the other.
 */
export function RefreshButton({
  onClick,
  isRefreshing,
  isRateLimited,
  cooldownSecondsLeft
}: {
  onClick: () => void;
  isRefreshing: boolean;
  isRateLimited: boolean;
  cooldownSecondsLeft: number;
}) {
  const disabled = isRefreshing || isRateLimited;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={isRateLimited ? `Wait ${cooldownSecondsLeft}s to refresh again` : "Refresh"}
      aria-label="Refresh"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-600 text-ink-400 transition-colors hover:border-gold-600/50 hover:text-gold-300 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <RefreshCw size={14} strokeWidth={2.2} className={isRefreshing ? "animate-spin" : ""} />
    </button>
  );
}

export { useRateLimitedRefresh };
