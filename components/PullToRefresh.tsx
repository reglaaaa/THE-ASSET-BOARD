"use client";

import { useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";

const THRESHOLD = 68;
const MAX_PULL = 96;

export function PullToRefresh({
  onRefresh,
  disabled = false,
  children
}: {
  onRefresh: () => Promise<void>;
  // When true (e.g. the shared refresh cooldown is active), the pull
  // gesture is ignored so it can't bypass the same rate limit the
  // refresh button enforces.
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing || disabled) return;
    // Only start tracking a pull if the page is already scrolled to the top —
    // otherwise this is just a normal scroll gesture.
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      tracking.current = true;
    } else {
      tracking.current = false;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!tracking.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPull(Math.min(delta * 0.45, MAX_PULL));
    } else {
      tracking.current = false;
      setPull(0);
    }
  }

  async function onTouchEnd() {
    if (!tracking.current) return;
    tracking.current = false;
    startY.current = null;
    if (pull > THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(56);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  const indicatorHeight = refreshing ? 56 : pull;
  const progress = Math.min(pull / THRESHOLD, 1);

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: indicatorHeight }}
      >
        {refreshing ? (
          <Loader2 size={18} strokeWidth={2.2} className="animate-spin text-gold-300" />
        ) : pull > 0 ? (
          <ArrowDown
            size={16}
            strokeWidth={2.2}
            className="text-ink-400 transition-transform"
            style={{
              opacity: progress,
              transform: `rotate(${progress >= 1 ? 180 : 0}deg)`
            }}
          />
        ) : null}
      </div>
      {children}
    </div>
  );
}
