"use client";

import { useEffect, useState } from "react";
import { Send, TriangleAlert, Flame, Globe, Lock } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import type { Category, Post } from "@/lib/supabaseClient";
import { findSimilar, type SimilarMatch } from "@/lib/similarity";
import { recentPostCount } from "@/lib/anonId";

const MAX = 500;
const SHORT_WORD_LIMIT = 4;

type ModalStep = null | "duplicate" | "short" | "frequent";
type Visibility = "public" | "ssc_only";

export function Composer({
  onSubmit,
  existingPosts = [],
  onSupportExisting
}: {
  onSubmit: (content: string, category: Category, urgent: boolean, visibility: Visibility) => Promise<void>;
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
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [posting, setPosting] = useState(false);

  const [modal, setModal] = useState<ModalStep>(null);
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);
  const [acknowledgedShort, setAcknowledgedShort] = useState(false);
  const [acknowledgedFrequent, setAcknowledgedFrequent] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<SimilarMatch<Post>[]>([]);

  // Re-warn if they keep editing after acknowledging a warning once.
  useEffect(() => {
    setAcknowledgedDuplicate(false);
    setAcknowledgedShort(false);
    setAcknowledgedFrequent(false);
  }, [content]);

  const canPost = content.trim().length > 0 && content.length <= MAX && !posting;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  async function doSubmit() {
    setPosting(true);
    setModal(null);
    try {
      await onSubmit(content.trim(), category, urgent, visibility);
      setContent("");
      setUrgent(false);
      setVisibility("public");
    } finally {
      setPosting(false);
    }
  }

  // Duplicate + short checks, run once the "posting again soon?" nudge
  // (if any) has been cleared.
  function checkDuplicateAndShort() {
    if (!acknowledgedDuplicate) {
      const matches = findSimilar(content, existingPosts, (p) => p.content, {
        threshold: 0.2,
        minDraftWords: 2,
        limit: 2
      });
      if (matches.length > 0) {
        setDuplicateMatches(matches);
        setModal("duplicate");
        return;
      }
    }

    if (!acknowledgedShort && wordCount <= SHORT_WORD_LIMIT) {
      setModal("short");
      return;
    }

    doSubmit();
  }

  function attemptSubmit() {
    if (!canPost) return;

    if (!acknowledgedFrequent && recentPostCount() > 0) {
      setModal("frequent");
      return;
    }

    checkDuplicateAndShort();
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

      <p className="mt-1 text-[10.5px] leading-snug text-ink-500/70">
        {visibility === "ssc_only"
          ? "Only the Student Council will see this — it won't appear in the public feed."
          : "This post will formally reach the student council — BatStateU LIMA — and may be seen by other students. Kindly be respectful."}
      </p>

      <div className="mt-2 flex items-center gap-1 self-start rounded-full border border-ink-600 bg-ink-900 p-0.5">
        <button
          type="button"
          onClick={() => setVisibility("public")}
          aria-pressed={visibility === "public"}
          title="Visible to everyone in the public feed"
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
            visibility === "public" ? "bg-gold-liquid-soft text-ink-950" : "text-ink-400 hover:text-gold-300"
          }`}
        >
          <Globe size={11} strokeWidth={2.4} />
          Public
        </button>
        <button
          type="button"
          onClick={() => setVisibility("ssc_only")}
          aria-pressed={visibility === "ssc_only"}
          title="Only the Student Council will see this"
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
            visibility === "ssc_only" ? "bg-ink-600 text-[#f2ecdb]" : "text-ink-400 hover:text-gold-300"
          }`}
        >
          <Lock size={11} strokeWidth={2.4} />
          SSC only
        </button>
      </div>

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
            onClick={attemptSubmit}
            disabled={!canPost}
            aria-label="Post anonymously"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-liquid-soft text-ink-950 transition-opacity disabled:opacity-30"
          >
            <Send size={14} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {modal === "frequent" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-ink-600 bg-ink-900 p-4 shadow-gold">
            <p className="font-display text-sm font-bold text-[#f2ecdb]">
              You just posted, is this urgent?
            </p>
            <p className="mt-1.5 text-xs text-ink-400">
              You&apos;ve already posted within the last hour. If this can wait,
              consider commenting on your earlier post instead.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-400 hover:text-ink-200"
              >
                Wait
              </button>
              <button
                onClick={() => {
                  setAcknowledgedFrequent(true);
                  setModal(null);
                  checkDuplicateAndShort();
                }}
                className="rounded-full bg-gold-liquid-soft px-3.5 py-1.5 text-xs font-medium text-ink-950"
              >
                Post anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "duplicate" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-ink-600 bg-ink-900 p-4 shadow-gold">
            <p className="font-display text-sm font-bold text-[#f2ecdb]">
              Someone may have said this already
            </p>
            <div className="mt-3 flex flex-col gap-1.5">
              {duplicateMatches.map(({ item }) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-md bg-ink-800/60 p-2"
                >
                  <p className="line-clamp-2 flex-1 text-[13px] leading-snug text-ink-300">
                    {item.content}
                  </p>
                  <button
                    onClick={() => {
                      setModal(null);
                      onSupportExisting?.(item);
                    }}
                    title="Support this post instead of posting a duplicate"
                    className="flex shrink-0 items-center gap-1 rounded-full bg-gold-liquid-soft px-2.5 py-1 text-[11px] font-medium text-ink-950"
                  >
                    <Flame size={11} strokeWidth={2.4} />
                    Support
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-400 hover:text-ink-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setModal(null);
                  if (!acknowledgedShort && wordCount <= SHORT_WORD_LIMIT) {
                    setModal("short");
                  } else {
                    doSubmit();
                  }
                }}
                className="rounded-full bg-gold-liquid-soft px-3.5 py-1.5 text-xs font-medium text-ink-950"
              >
                Post anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === "short" && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-ink-600 bg-ink-900 p-4 shadow-gold">
            <p className="font-display text-sm font-bold text-[#f2ecdb]">
              Your concern is short, continue posting?
            </p>
            <p className="mt-1.5 text-xs text-ink-400">
              A bit more detail helps the council actually act on it.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-400 hover:text-ink-200"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setAcknowledgedShort(true);
                  setModal(null);
                  doSubmit();
                }}
                className="rounded-full bg-gold-liquid-soft px-3.5 py-1.5 text-xs font-medium text-ink-950"
              >
                Post anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
