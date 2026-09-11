"use client";

import { useState } from "react";
import { Send, TriangleAlert } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/supabaseClient";

const MAX = 500;

export function Composer({
  onSubmit
}: {
  onSubmit: (content: string, category: Category, urgent: boolean) => Promise<void>;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("concern");
  const [urgent, setUrgent] = useState(false);
  const [posting, setPosting] = useState(false);

  const canPost = content.trim().length > 0 && content.length <= MAX && !posting;

  async function handleSubmit() {
    if (!canPost) return;
    setPosting(true);
    try {
      await onSubmit(content.trim(), category, urgent);
      setContent("");
      setUrgent(false);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-800/60 p-3.5">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's the issue? No names needed."
        rows={3}
        maxLength={MAX}
        className="w-full resize-none bg-transparent text-[15px] text-[#f2ecdb] placeholder:text-ink-400 focus:outline-none"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ink-700 pt-2.5">
        <div className="flex items-center gap-1.5">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              title={label}
              aria-label={label}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
                category === value
                  ? "bg-gold-liquid-soft text-ink-950"
                  : "text-ink-400 hover:bg-ink-700 hover:text-gold-300"
              }`}
            >
              <Icon size={14} strokeWidth={2.2} />
              {label}
            </button>
          ))}

          <button
            title="Mark as urgent — highlights this post in red for the council"
            aria-label="Mark as urgent"
            aria-pressed={urgent}
            onClick={() => setUrgent((v) => !v)}
            className={`ml-0.5 flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors ${
              urgent
                ? "bg-blood-500 text-ink-950"
                : "text-ink-400 hover:bg-blood-700/30 hover:text-blood-400"
            }`}
          >
            <TriangleAlert size={14} strokeWidth={2.2} />
            Urgent
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`text-xs ${content.length > MAX - 40 ? "text-blood-400" : "text-ink-400"}`}>
            {MAX - content.length}
          </span>
          <button
            onClick={handleSubmit}
            disabled={!canPost}
            aria-label="Post anonymously"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-liquid-soft text-ink-950 transition-opacity disabled:opacity-30"
          >
            <Send size={14} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}
