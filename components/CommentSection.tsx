"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MessageCircle, Send, ShieldCheck, Trash2, Lock, Globe } from "lucide-react";
import { supabase, type Comment } from "@/lib/supabaseClient";
import { getAnonId, recentCommentCount, recordComment } from "@/lib/anonId";

// Warn once someone is about to send their 3rd comment within this window.
const FREQUENT_COMMENT_THRESHOLD = 2;

const MAX = 300;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function CommentSection({
  postId,
  commentsCount,
  isAdmin = false,
  adminPassword = null
}: {
  postId: string;
  commentsCount: number;
  isAdmin?: boolean;
  adminPassword?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFrequentWarning, setShowFrequentWarning] = useState(false);
  const [acknowledgedFrequent, setAcknowledgedFrequent] = useState(false);

  // Re-warn if they keep editing after acknowledging the warning once.
  useEffect(() => {
    setAcknowledgedFrequent(false);
  }, [draft]);

  const [sscDraft, setSscDraft] = useState("");
  const [sscVisibility, setSscVisibility] = useState<"public" | "ssc_only">("public");
  const [sscPosting, setSscPosting] = useState(false);
  const [sscError, setSscError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoading(true);
      if (isAdmin && adminPassword) {
        // Admin sees everything, including SSC-only internal replies.
        try {
          const res = await fetch(
            `/api/comments?post_id=${encodeURIComponent(postId)}&password=${encodeURIComponent(adminPassword)}`
          );
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.comments) setComments(json.comments as Comment[]);
        } catch {
          // fall through with whatever (if anything) was already loaded
        }
      } else {
        const { data, error } = await supabase
          .from("comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (!error && data) setComments(data as Comment[]);
      }
      setLoaded(true);
      setLoading(false);
    }
  }

  function handleSend() {
    const content = draft.trim();
    if (!content || content.length > MAX || posting) return;

    if (!acknowledgedFrequent && recentCommentCount() >= FREQUENT_COMMENT_THRESHOLD) {
      setShowFrequentWarning(true);
      return;
    }

    doSend(content);
  }

  async function doSend(content: string) {
    setPosting(true);
    setError(null);

    const { data, error } = await supabase.rpc("create_comment", {
      p_post_id: postId,
      p_content: content,
      p_anon_id: getAnonId()
    });

    if (error) {
      setError(error.message || "Couldn't post that comment — please try again.");
    } else {
      recordComment();
      setComments((prev) => [...prev, data as Comment]);
      setDraft("");
    }
    setPosting(false);
  }

  async function handleSendOfficial() {
    const content = sscDraft.trim();
    if (!content || content.length > MAX || sscPosting || !adminPassword) return;
    setSscPosting(true);
    setSscError(null);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          post_id: postId,
          content,
          visibility: sscVisibility
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSscError(json.error ?? "Couldn't post that reply, please try again.");
        return;
      }
      setComments((prev) => [...prev, json.comment as Comment]);
      setSscDraft("");
      setSscVisibility("public");
    } catch {
      setSscError("Network error, please try again.");
    } finally {
      setSscPosting(false);
    }
  }

  async function handleDeleteComment(id: string) {
    if (!adminPassword) return;
    if (!window.confirm("Delete this comment? This can't be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, id })
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== id));
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "Couldn't delete that comment.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0 flex-1">
      <button
        onClick={toggleOpen}
        aria-expanded={open}
        aria-label={open ? "Hide comments" : "Show comments"}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-400 transition-colors hover:bg-ink-700/60 hover:text-gold-300"
      >
        <MessageCircle size={16} strokeWidth={2.2} />
        {commentsCount}
      </button>

      {open && (
        <div className="mt-2 flex flex-col gap-2 border-t border-ink-700 pt-2.5">
          {loading && <p className="text-xs text-ink-400">Loading comments…</p>}

          {!loading && loaded && comments.length === 0 && (
            <p className="text-xs text-ink-400">No comments yet — be the first.</p>
          )}

          {comments.map((c) =>
            c.is_official ? (
              <div
                key={c.id}
                className={
                  c.visibility === "ssc_only"
                    ? "rounded-lg border border-dashed border-ink-500/60 bg-ink-800/40 px-3 py-2"
                    : "rounded-lg border border-gold-600/40 bg-gold-liquid-soft/[0.08] px-3 py-2"
                }
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  {c.visibility === "ssc_only" ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">
                      <Lock size={11} strokeWidth={2.4} />
                      Internal · SSC only
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
                      <Image src="/logo-mark.png" alt="" width={14} height={14} className="shrink-0" />
                      <ShieldCheck size={11} strokeWidth={2.4} />
                      Official reply · SSC
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="Delete reply"
                      title="Delete (admin only)"
                      className="shrink-0 text-ink-400 hover:text-blood-400 disabled:opacity-40"
                    >
                      <Trash2 size={12} strokeWidth={2.2} />
                    </button>
                  )}
                </div>
                <p
                  className={
                    c.visibility === "ssc_only"
                      ? "whitespace-pre-wrap text-[13px] leading-relaxed text-ink-300"
                      : "whitespace-pre-wrap text-[13px] leading-relaxed text-[#f2ecdb]/95"
                  }
                >
                  {c.content}
                </p>
                <p className="mt-1 text-[10px] text-ink-400">{timeAgo(c.created_at)}</p>
              </div>
            ) : (
              <div key={c.id} className="rounded-lg bg-ink-900/60 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#f2ecdb]/85">
                    {c.content}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="Delete comment"
                      title="Delete (admin only)"
                      className="shrink-0 text-ink-400 hover:text-blood-400 disabled:opacity-40"
                    >
                      <Trash2 size={12} strokeWidth={2.2} />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-ink-400">{timeAgo(c.created_at)}</p>
              </div>
            )
          )}

          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Add an anonymous comment…"
              maxLength={MAX}
              className="flex-1 rounded-full border border-ink-600 bg-ink-900 px-3 py-1.5 text-xs text-[#f2ecdb] placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || posting}
              aria-label="Send comment"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-liquid-soft text-ink-950 disabled:opacity-30"
            >
              <Send size={12} strokeWidth={2.4} />
            </button>
          </div>

          {error && <p className="text-[11px] text-blood-400">{error}</p>}

          {isAdmin && (
            <div className="mt-1 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 self-start rounded-full border border-ink-600 bg-ink-900 p-0.5">
                <button
                  type="button"
                  onClick={() => setSscVisibility("public")}
                  aria-pressed={sscVisibility === "public"}
                  title="Visible to everyone in the comment thread"
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
                    sscVisibility === "public"
                      ? "bg-gold-liquid-soft text-ink-950"
                      : "text-ink-400 hover:text-gold-300"
                  }`}
                >
                  <Globe size={11} strokeWidth={2.4} />
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setSscVisibility("ssc_only")}
                  aria-pressed={sscVisibility === "ssc_only"}
                  title="Internal note — visible only in admin mode"
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-medium transition-colors ${
                    sscVisibility === "ssc_only"
                      ? "bg-ink-600 text-[#f2ecdb]"
                      : "text-ink-400 hover:text-gold-300"
                  }`}
                >
                  <Lock size={11} strokeWidth={2.4} />
                  SSC only
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Image
                    src="/logo-mark.png"
                    alt=""
                    width={13}
                    height={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    value={sscDraft}
                    onChange={(e) => setSscDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendOfficial();
                    }}
                    placeholder={
                      sscVisibility === "ssc_only" ? "Internal note (SSC only)…" : "Reply as SSC (official)…"
                    }
                    maxLength={MAX}
                    className="w-full rounded-full border border-gold-600/40 bg-ink-900 py-1.5 pl-8 pr-3 text-xs text-[#f2ecdb] placeholder:text-gold-300/60 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSendOfficial}
                  disabled={!sscDraft.trim() || sscPosting}
                  aria-label={sscVisibility === "ssc_only" ? "Save internal SSC note" : "Send official SSC reply"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-liquid-soft text-ink-950 disabled:opacity-30"
                >
                  <Send size={12} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          )}
          {isAdmin && sscError && <p className="text-[11px] text-blood-400">{sscError}</p>}
        </div>
      )}

      {showFrequentWarning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl border border-ink-600 bg-ink-900 p-4 shadow-gold">
            <p className="font-display text-sm font-bold text-[#f2ecdb]">
              You just commented, is this needed?
            </p>
            <p className="mt-1.5 text-xs text-ink-400">
              You&apos;ve commented a few times in the last 10 minutes. Give people
              a chance to reply before adding more.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFrequentWarning(false)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-ink-400 hover:text-ink-200"
              >
                Wait
              </button>
              <button
                onClick={() => {
                  setAcknowledgedFrequent(true);
                  setShowFrequentWarning(false);
                  doSend(draft.trim());
                }}
                className="rounded-full bg-gold-liquid-soft px-3.5 py-1.5 text-xs font-medium text-ink-950"
              >
                Send anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
