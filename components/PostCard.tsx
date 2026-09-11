"use client";

import { Flame, TriangleAlert } from "lucide-react";
import { categoryMeta } from "@/lib/categories";
import type { Post } from "@/lib/supabaseClient";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
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

  return (
    <article
      className={`rounded-xl border p-4 transition-colors ${
        post.is_urgent
          ? "border-blood-600/60 bg-blood-700/[0.08] shadow-blood"
          : "border-ink-600 bg-ink-800/60 hover:border-gold-600/40"
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between text-xs text-ink-600">
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

      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => onToggleLike(post.id)}
          aria-pressed={liked}
          aria-label={liked ? "Remove support" : "Support this"}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all ${
            liked
              ? "bg-gold-liquid-soft text-ink-950 font-medium shadow-gold"
              : "text-ink-600 hover:text-gold-300 hover:bg-ink-700/60"
          }`}
        >
          <Flame size={16} strokeWidth={2.2} fill={liked ? "#08070a" : "none"} />
          {post.likes_count}
        </button>
      </div>
    </article>
  );
}
