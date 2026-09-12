"use client";

import { Plus } from "lucide-react";

export function FAB({
  onClick,
  label = "New post"
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold-liquid-soft text-ink-950 shadow-gold transition-transform duration-150 active:scale-90"
    >
      <Plus size={26} strokeWidth={2.4} />
    </button>
  );
}
