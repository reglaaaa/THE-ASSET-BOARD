"use client";

import { useEffect, useState } from "react";

function formatAgo(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/**
 * Replaces a standalone refresh icon with a tappable freshness label
 * ("Updated 2m ago"). Gives the control a reason to exist — it's telling
 * you something — instead of being a bare icon floating in the header.
 * Tapping it still triggers the same rate-limited refresh as before; it's
 * just presented as information first, action second. Matches the plain
 * text, no-border treatment used by the filter/sort row.
 */
export function RefreshStatus({
  onClick,
  isRefreshing,
  isRateLimited,
  cooldownSecondsLeft,
  lastUpdatedAt
}: {
  onClick: () => void;
  isRefreshing: boolean;
  isRateLimited: boolean;
  cooldownSecondsLeft: number;
  lastUpdatedAt: number | null;
}) {
  // Re-render periodically so "2m ago" keeps advancing without needing an
  // actual data refresh.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 15000);
    return () => clearInterval(id);
  }, []);

  const disabled = isRefreshing || isRateLimited;

  let label: string;
  if (isRefreshing) label = "Refreshing…";
  else if (isRateLimited) label = `Updated · wait ${cooldownSecondsLeft}s`;
  else if (lastUpdatedAt) label = `Updated ${formatAgo(Date.now() - lastUpdatedAt)}`;
  else label = "Refresh";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 whitespace-nowrap text-[12px] leading-none transition-colors ${
        disabled ? "cursor-not-allowed text-ink-600" : "text-ink-400 hover:text-gold-300"
      }`}
    >
      {label}
    </button>
  );
}
