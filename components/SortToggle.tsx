"use client";

export type Sort = "new" | "top";

export function SortToggle({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  return (
    <div className="flex items-center gap-2 text-[13px] leading-none">
      <button
        onClick={() => onChange("new")}
        aria-pressed={value === "new"}
        className={`py-1 transition-colors ${
          value === "new" ? "font-semibold text-gold-300" : "font-normal text-ink-400 hover:text-ink-200"
        }`}
      >
        Latest
      </button>
      <span className="text-ink-600">·</span>
      <button
        onClick={() => onChange("top")}
        aria-pressed={value === "top"}
        className={`py-1 transition-colors ${
          value === "top" ? "font-semibold text-gold-300" : "font-normal text-ink-400 hover:text-ink-200"
        }`}
      >
        Top
      </button>
    </div>
  );
}
