"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps an async load function with:
 *  - a minimum cooldown between refreshes (blocks button-mashing / accidental
 *    double-fires from pull-to-refresh + button both triggering at once)
 *  - de-duping so an in-flight refresh can't be started twice concurrently
 *
 * This is purely client-side UX protection (disables the control, shows a
 * countdown). It is not a security boundary — if you need to stop abusive
 * request volume you also need server-side rate limiting (see notes in the
 * refresh button component).
 */
export function useRateLimitedRefresh(loadFn: () => Promise<void>, cooldownMs = 12000) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const lastRunAt = useRef(0);
  const inFlight = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const tickCountdown = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const remaining = cooldownMs - (Date.now() - lastRunAt.current);
      if (remaining <= 0) {
        setCooldownRemainingMs(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setCooldownRemainingMs(remaining);
      }
    }, 250);
  }, [cooldownMs]);

  const refresh = useCallback(async () => {
    const sinceLast = Date.now() - lastRunAt.current;
    if (inFlight.current || sinceLast < cooldownMs) return;

    inFlight.current = true;
    setIsRefreshing(true);
    lastRunAt.current = Date.now();
    setCooldownRemainingMs(cooldownMs);
    tickCountdown();

    try {
      await loadFn();
    } finally {
      inFlight.current = false;
      setIsRefreshing(false);
    }
  }, [loadFn, cooldownMs, tickCountdown]);

  return {
    refresh,
    isRefreshing,
    isRateLimited: cooldownRemainingMs > 0,
    cooldownSecondsLeft: Math.ceil(cooldownRemainingMs / 1000)
  };
}
