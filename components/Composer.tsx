"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, TriangleAlert, Flame } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { Category, Post } from "@/lib/supabaseClient";
import { findSimilar } from "@/lib/similarity";

const MAX = 500;

export function Composer({
  onSubmit,
  existingPosts = [],
  onSupportExisting
}: {
  onSubmit: (content: string, category: Category, urgent: boolean) => Promise<void>;
  // Posts already loaded on the page — reused for the client-side
  // duplicate check, no extra fetch needed.
  existingPosts?: Post[];
  // Called when the person taps "Support this instead" on a suggested
  // duplicate. The parent handles liking it + closing the composer.
  onSupportExisting?: (post: Post) => void;
}) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Category>("concern");
  const [urgent, setUrgent] = useState(false);
  const [posting, setPosting] = useState(false);
  const [dismissedDuplicates, setDismissedDuplicates] = useState(false);

  const canPost = content.trim().length > 0 && content.length <= MAX && !posting;

  // Debounce the similarity check so it isn't recomputed on every keystroke.
  const [debouncedContent, setDebouncedContent] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedContent(content), 350);
    return () => clearTimeout(t);
  }, [content]);

  useEffect(() => {
    setDismissedDuplicates(false);
  }, [debouncedContent]);

  const possibleDuplicates = useMemo(
    () =>
      findSimilar(debouncedContent, existingPosts, (p) => p.content, {
        threshold: 0.3,
        minDraftWords: 3,
        limit: 2
      }),
    [debouncedContent, existingPosts]
  );

  const showDuplicates = possibleDuplicates.length > 0 && !dismissedDuplicates && !posting;

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

      {showDuplicates && (
        <div className="mt-1 mb-2 rounded-lg border border-gold-600/40 bg-gold-liquid-soft/[0.08] p-2.5">
          <p className="text-xs font-medium text-gold-300">
            Someone may have already raised this — support it instead so it
            counts toward one post the council sees:
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {possibleDuplicates.map(({ item }) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-2 rounded-md bg-ink-900/60 p-2"
              >
                <p className="line-clamp-2 flex-1 text-[13px] leading-snug text-ink-300">
                  {item.content}
                </p>
                <button
                  onClick={() => onSupportExisting?.(item)}
                  title="Support this post instead of posting a duplicate"
                  className="flex shrink-0 items-center gap-1 rounded-full bg-gold-liquid-soft px-2.5 py-1 text-[11px] font-medium text-ink-950"
                >
                  <Flame size={11} strokeWidth={2.4} />
                  Support
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setDismissedDuplicates(true)}
            className="mt-2 text-[11px] font-medium text-ink-400 underline underline-offset-2"
          >
            No, this is different — post it anyway
          </button>
        </div>
      )}

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
