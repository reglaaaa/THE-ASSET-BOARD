"use client";

import { useState } from "react";
import { Flame, Pencil, Trash2, TriangleAlert, X, Check } from "lucide-react";
import { CATEGORIES, categoryMeta } from "@/lib/categories";
import { STATUSES, statusMeta } from "@/lib/statuses";
import type { Post, Category, PostStatus } from "@/lib/supabaseClient";
import { CommentSection } from "@/components/CommentSection";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PostCard({
  post,
  liked,
  onToggleLike,
  isAdmin = false,
  adminPassword = null,
  onChanged
}: {
  post: Post;
  liked: boolean;
  onToggleLike: (id: string) => void;
  isAdmin?: boolean;
  adminPassword?: string | null;
  onChanged?: () => void;
}) {
  const meta = categoryMeta(post.category);
  const Icon = meta.icon;
  const currentStatus = statusMeta(post.status);
  const [pulse, setPulse] = useState(0);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [draftCategory, setDraftCategory] = useState<Category>(post.category);
  const [draftUrgent, setDraftUrgent] = useState(post.is_urgent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settingStatus, setSettingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(post.content);
    setDraftCategory(post.category);
    setDraftUrgent(post.is_urgent);
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!adminPassword || saving) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: adminPassword,
          id: post.id,
          content: trimmed,
          category: draftCategory,
          is_urgent: draftUrgent
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Couldn't save that, please try again.");
        return;
      }
      setEditing(false);
      onChanged?.();
    } catch {
      setError("Network error, please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!adminPassword) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, id: post.id })
      });
      if (res.ok) {
        onChanged?.();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "Couldn't delete that post.");
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleSetStatus(newStatus: PostStatus | null) {
    if (!adminPassword || settingStatus) return;
    setSettingStatus(true);
    try {
      const res = await fetch("/api/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword, id: post.id, status: newStatus })
      });
      if (res.ok) {
        onChanged?.();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error ?? "Couldn't update status.");
      }
    } catch {
      alert("Network error, please try again.");
    } finally {
      setSettingStatus(false);
    }
  }

  return (
    <article className="py-4 transition-colors">
      <div className="mb-2.5 flex items-center justify-between text-xs text-ink-400">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 px-2.5 py-1 text-gold-300">
          <Icon size={13} strokeWidth={2} />
          {meta.label}
        </span>
        <div className="flex items-center gap-2">
          {post.is_urgent && (
            <span className="inline-flex items-center gap-1 text-blood-400">
              <TriangleAlert size={13} strokeWidth={2.2} />
              Urgent
            </span>
          )}
          <span>{timeAgo(post.created_at)}</span>
          {isAdmin && !editing && (
            <span className="flex items-center gap-1.5 border-l border-ink-700 pl-2">
              <button
                onClick={startEdit}
                aria-label="Edit post"
                title="Edit (admin only)"
                className="text-ink-400 hover:text-gold-300"
              >
                <Pencil size={13} strokeWidth={2.2} />
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Delete post"
                title="Delete (admin only)"
                className="text-ink-400 hover:text-blood-400 disabled:opacity-40"
              >
                <Trash2 size={13} strokeWidth={2.2} />
              </button>
            </span>
          )}
        </div>
      </div>

      {isAdmin && !editing ? (
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
          {STATUSES.map(({ value, label, icon: StatusIcon, textClass, bgClass }) => {
            const active = post.status === value;
            return (
              <button
                key={value}
                onClick={() => handleSetStatus(active ? null : value)}
                disabled={settingStatus}
                aria-pressed={active}
                title={active ? `Clear "${label}" flag` : `Flag as ${label}`}
                className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors disabled:opacity-40 ${
                  active
                    ? `${bgClass} ${textClass}`
                    : "border-ink-600 text-ink-400 hover:border-gold-600/50 hover:text-gold-300"
                }`}
              >
                <StatusIcon size={12} strokeWidth={2.4} />
                {label}
              </button>
            );
          })}
        </div>
      ) : (
        currentStatus && (
          <div className="mb-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${currentStatus.bgClass} ${currentStatus.textClass}`}
            >
              <currentStatus.icon size={12} strokeWidth={2.4} />
              {currentStatus.label}
            </span>
          </div>
        )
      )}

      {editing ? (
        <div className="flex flex-col gap-2.5">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-[15px] text-[#f2ecdb] focus:border-gold-500 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map(({ value, label, icon: CatIcon }) => (
              <button
                key={value}
                onClick={() => setDraftCategory(value)}
                aria-pressed={draftCategory === value}
                className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors ${
                  draftCategory === value
                    ? "bg-gold-liquid-soft text-ink-950"
                    : "text-ink-400 hover:bg-ink-700 hover:text-gold-300"
                }`}
              >
                <CatIcon size={13} strokeWidth={2.2} />
                {label}
              </button>
            ))}
            <button
              onClick={() => setDraftUrgent((v) => !v)}
              aria-pressed={draftUrgent}
              className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors ${
                draftUrgent
                  ? "bg-blood-500 text-ink-950"
                  : "text-ink-400 hover:bg-blood-700/30 hover:text-blood-400"
              }`}
            >
              <TriangleAlert size={13} strokeWidth={2.2} />
              Urgent
            </button>
          </div>

          {error && <p className="text-[11px] text-blood-400">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!draft.trim() || saving}
              className="flex h-8 items-center gap-1.5 rounded-full bg-gold-liquid-soft px-3 text-xs font-medium text-ink-950 disabled:opacity-40"
            >
              <Check size={13} strokeWidth={2.4} />
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex h-8 items-center gap-1.5 rounded-full border border-ink-600 px-3 text-xs font-medium text-ink-400 hover:text-blood-400"
            >
              <X size={13} strokeWidth={2.4} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#f2ecdb]/90">
          {post.content}
        </p>
      )}

      <div className="mt-3 flex items-start gap-1">
        <button
          onClick={() => {
            onToggleLike(post.id);
            setPulse((p) => p + 1);
          }}
          aria-pressed={liked}
          aria-label={liked ? "Remove support" : "Support this"}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
            liked
              ? "bg-gold-liquid-soft text-ink-950 font-medium shadow-gold"
              : "text-ink-400 hover:text-gold-300 hover:bg-ink-700/60"
          }`}
        >
          <Flame
            key={pulse}
            size={16}
            strokeWidth={2.2}
            fill={liked ? "#08070a" : "none"}
            className="animate-pop"
          />
          {post.likes_count}
        </button>

        <CommentSection
          postId={post.id}
          commentsCount={post.comments_count}
          isAdmin={isAdmin}
          adminPassword={adminPassword}
        />
      </div>
    </article>
  );
}
