"use client";

import type { Category } from "@/lib/supabaseClient";

export type FeedFilter = "all" | Category | "urgent";

const OPTIONS: { value: FeedFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "concern", label: "Concern" },
  { value: "suggestion", label: "Suggestion" },
  { value: "urgent", label: "Urgent" }
];

export function FilterRow({
  active,
  onChange
}: {
  active: FeedFilter;
  onChange: (f: FeedFilter) => void;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto text-[13px] leading-none">
      {OPTIONS.map(({ value, label }, i) => {
        const isActive = active === value;
        const activeColor = value === "urgent" ? "text-blood-400" : "text-gold-300";
        return (
          <span key={value} className="flex shrink-0 items-center gap-2">
            {i > 0 && <span className="text-ink-600">·</span>}
            <button
              onClick={() => onChange(value)}
              aria-pressed={isActive}
              className={`shrink-0 whitespace-nowrap py-1 transition-colors ${
                isActive ? `font-semibold ${activeColor}` : "font-normal text-ink-400 hover:text-ink-200"
              }`}
            >
              {label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
