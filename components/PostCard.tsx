"use client";

import { useState } from "react";
import { Flame, TriangleAlert } from "lucide-react";
import { categoryMeta } from "@/lib/categories";
import type { Post } from "@/lib/supabaseClient";
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
  onToggleLike
}: {
  post: Post;
  liked: boolean;
  onToggleLike: (id: string) => void;
}) {
  const meta = categoryMeta(post.category);
  const Icon = meta.icon;
  const [pulse, setPulse] = useState(0);

  return (
    <article
      className={`rounded-xl border p-4 transition-colors ${
        post.is_urgent
          ? "border-blood-600/60 bg-blood-700/[0.08] shadow-blood"
          : "border-ink-600 bg-ink-800/60 hover:border-gold-600/40"
      }`}
    >
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
        </div>
      </div>

      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#f2ecdb]/90">
        {post.content}
      </p>

      <div className="mt-3 flex items-center gap-1">
        <button
          onClick={() => {
            onToggleLike(post.id);
            setPulse((p) => p + 1);
          }}
          aria-pressed={liked}
          aria-label={liked ? "Remove support" : "Support this"}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
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

        <CommentSection postId={post.id} commentsCount={post.comments_count} />
      </div>
    </article>
  );
}
