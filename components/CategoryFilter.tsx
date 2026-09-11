"use client";

import { LayoutGrid } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/supabaseClient";

export function CategoryFilter({
  active,
  onChange
}: {
  active: Category | "all";
  onChange: (c: Category | "all") => void;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <button
        title="All"
        aria-label="All categories"
        aria-pressed={active === "all"}
        onClick={() => onChange("all")}
        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
          active === "all"
            ? "border-gold-400 bg-gold-liquid-soft text-ink-950"
            : "border-ink-600 text-ink-400 hover:text-gold-300"
        }`}
      >
        <LayoutGrid size={14} strokeWidth={2.2} />
        All
      </button>
      {CATEGORIES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          title={label}
          aria-label={label}
          aria-pressed={active === value}
          onClick={() => onChange(value)}
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
            active === value
              ? "border-gold-400 bg-gold-liquid-soft text-ink-950"
              : "border-ink-600 text-ink-400 hover:text-gold-300"
          }`}
        >
          <Icon size={14} strokeWidth={2.2} />
          {label}
        </button>
      ))}
    </div>
  );
}
