"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase, type Post, type Category } from "@/lib/supabaseClient";
import { getAnonId, getLikedSet, persistLiked } from "@/lib/anonId";
import { Logo } from "@/components/Logo";
import { Composer } from "@/components/Composer";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PostCard } from "@/components/PostCard";

type Sort = "new" | "top";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<Sort>("new");
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLiked(getLikedSet());
    loadPosts();

    // Live updates: new posts and like-count changes appear without a refresh
    const channel = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPosts() {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPosts(data as Post[]);
    setLoading(false);
  }

  async function handleCreate(content: string, category: Category, urgent: boolean) {
    const { error } = await supabase
      .from("posts")
      .insert({ content, category, is_urgent: urgent });
    if (error) {
      alert("Couldn't post that — please try again.");
      return;
    }
    await loadPosts();
  }

  async function toggleLike(postId: string) {
    const anonId = getAnonId();
    const isLiked = liked.has(postId);
    const next = new Set(liked);

    // optimistic UI
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
          : p
      )
    );

    if (isLiked) {
      next.delete(postId);
      setLiked(next);
      persistLiked(next);
      await supabase.from("likes").delete().eq("post_id", postId).eq("anon_id", anonId);
    } else {
      next.add(postId);
      setLiked(next);
      persistLiked(next);
      await supabase.from("likes").insert({ post_id: postId, anon_id: anonId });
    }
  }

  const visiblePosts = useMemo(() => {
    let list = filter === "all" ? posts : posts.filter((p) => p.category === filter);
    if (sort === "top") {
      list = [...list].sort((a, b) => b.likes_count - a.likes_count);
    }
    return list;
  }, [posts, filter, sort]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-10">
      <header className="sticky top-0 z-10 -mx-4 border-b border-ink-700 bg-ink-950/85 px-4 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/transparency"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-600 px-3 py-1.5 text-xs text-ink-400 hover:text-gold-300"
          >
            <ShieldCheck size={13} strokeWidth={2.2} />
            Transparency
          </Link>
        </div>
        <p className="mt-1.5 text-xs tracking-wide text-ink-400">
          Engineered to Serve. United to Lead.
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <CategoryFilter active={filter} onChange={setFilter} />
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-ink-600 p-0.5">
            <button
              title="Newest"
              aria-pressed={sort === "new"}
              onClick={() => setSort("new")}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                sort === "new" ? "bg-gold-liquid-soft text-ink-950" : "text-ink-400"
              }`}
            >
              <Clock size={13} strokeWidth={2.2} />
            </button>
            <button
              title="Top"
              aria-pressed={sort === "top"}
              onClick={() => setSort("top")}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${
                sort === "top" ? "bg-gold-liquid-soft text-ink-950" : "text-ink-400"
              }`}
            >
              <TrendingUp size={13} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      <section className="mt-4">
        <Composer onSubmit={handleCreate} />
      </section>

      <section className="mt-4 flex flex-col gap-2.5">
        {loading && (
          <p className="py-10 text-center text-sm text-ink-400">Loading the feed…</p>
        )}

        {!loading && visiblePosts.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-400">
            Nothing here yet. Be the first to raise it.
          </p>
        )}

        {visiblePosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            liked={liked.has(post.id)}
            onToggleLike={toggleLike}
          />
        ))}
      </section>
    </main>
  );
}
