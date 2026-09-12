"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, Send, ShieldCheck, Trash2 } from "lucide-react";
import { supabase, type Comment } from "@/lib/supabaseClient";
import { getAnonId } from "@/lib/anonId";

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

  const [sscDraft, setSscDraft] = useState("");
  const [sscPosting, setSscPosting] = useState(false);
  const [sscError, setSscError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      setLoading(true);
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (!error && data) setComments(data as Comment[]);
      setLoaded(true);
      setLoading(false);
    }
  }

  async function handleSend() {
    const content = draft.trim();
    if (!content || content.length > MAX || posting) return;
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
        body: JSON.stringify({ password: adminPassword, post_id: postId, content })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSscError(json.error ?? "Couldn't post that reply — please try again.");
        return;
      }
      setComments((prev) => [...prev, json.comment as Comment]);
      setSscDraft("");
    } catch {
      setSscError("Network error — please try again.");
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
                className="rounded-lg border border-gold-600/40 bg-gold-liquid-soft/[0.08] px-3 py-2"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
                    <Image src="/logo-mark.png" alt="" width={14} height={14} className="shrink-0" />
                    <ShieldCheck size={11} strokeWidth={2.4} />
                    Official reply · SSC
                  </span>
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
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#f2ecdb]/95">
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
            <div className="mt-1 flex items-center gap-2 rounded-full border border-gold-600/40 bg-ink-900 pl-3 pr-1">
              <Image src="/logo-mark.png" alt="" width={14} height={14} className="shrink-0" />
              <input
                value={sscDraft}
                onChange={(e) => setSscDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendOfficial();
                }}
                placeholder="Reply as SSC (official)…"
                maxLength={MAX}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-xs text-[#f2ecdb] placeholder:text-gold-300/60 focus:outline-none"
              />
              <button
                onClick={handleSendOfficial}
                disabled={!sscDraft.trim() || sscPosting}
                aria-label="Send official SSC reply"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-liquid-soft text-ink-950 disabled:opacity-30"
              >
                <Send size={12} strokeWidth={2.4} />
              </button>
            </div>
          )}
          {isAdmin && sscError && <p className="text-[11px] text-blood-400">{sscError}</p>}
        </div>
      )}
    </div>
  );
}
