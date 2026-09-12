"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function BottomSheet({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 220);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border-t border-ink-600 bg-ink-900 shadow-gold transition-transform duration-200 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-ink-600" />
        <div className="flex shrink-0 items-center justify-between px-4 pt-2.5">
          {title ? (
            <span className="font-display text-sm font-bold text-[#f2ecdb]">{title}</span>
          ) : (
            <span />
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-ink-400 hover:text-blood-400"
          >
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        <div className="overflow-y-auto p-4 pt-2">{children}</div>
      </div>
    </div>
  );
}
