"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Inbox, Lock, ShieldCheck, TrendingUp } from "lucide-react";
import { supabase, type Post, type Category, type Article } from "@/lib/supabaseClient";
import { getAnonId, getLikedSet, persistLiked, recordPost } from "@/lib/anonId";
import { useAdmin } from "@/lib/useAdmin";
import { Logo } from "@/components/Logo";
import { Composer } from "@/components/Composer";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PostCard } from "@/components/PostCard";
import { FAB } from "@/components/FAB";
import { BottomSheet } from "@/components/BottomSheet";
import { EmptyState } from "@/components/EmptyState";
import { FeedSkeleton } from "@/components/skeletons/PostCardSkeleton";
import { PullToRefresh } from "@/components/PullToRefresh";

type Sort = "new" | "top";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestArticle, setLatestArticle] = useState<Article | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<Sort>("new");
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [composerOpen, setComposerOpen] = useState(false);

  const { isAdmin, password: adminPassword, login, logout } = useAdmin();
  const [adminSheetOpen, setAdminSheetOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    setLiked(getLikedSet());
    loadPosts();
    loadLatestArticle();

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

  async function loadLatestArticle() {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    if (!error && data && data.length > 0) setLatestArticle(data[0] as Article);
  }

  async function loadPosts() {
    if (isAdmin && adminPassword) {
      // Admin sees everything, including SSC-only posts.
      try {
        const res = await fetch(`/api/posts?password=${encodeURIComponent(adminPassword)}`);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.posts) {
          setPosts(json.posts as Post[]);
          setLoading(false);
          return;
        }
      } catch {
        // fall through to the public query below
      }
    }
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setPosts(data as Post[]);
    setLoading(false);
  }

  async function handleCreate(
    content: string,
    category: Category,
    urgent: boolean,
    visibility: "public" | "ssc_only"
  ) {
    const { error } = await supabase.rpc("create_post", {
      p_content: content,
      p_category: category,
      p_is_urgent: urgent,
      p_anon_id: getAnonId(),
      p_visibility: visibility
    });
    if (error) {
      alert(error.message || "Couldn't post that — please try again.");
      return;
    }
    recordPost();
    setComposerOpen(false);
    await loadPosts();
  }

  async function toggleLike(postId: string) {
    const anonId = getAnonId();
    const isLiked = liked.has(postId);
    const prevLiked = new Set(liked);
    const next = new Set(liked);

    // optimistic UI
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
          : p
      )
    );
    if (isLiked) next.delete(postId);
    else next.add(postId);
    setLiked(next);
    persistLiked(next);

    const { error } = isLiked
      ? await supabase.from("likes").delete().eq("post_id", postId).eq("anon_id", anonId)
      : await supabase.from("likes").insert({ post_id: postId, anon_id: anonId });

    if (error) {
      // Roll back the optimistic change — the write didn't actually happen
      // (e.g. rate limited, or a duplicate insert from a double-click).
      setLiked(prevLiked);
      persistLiked(prevLiked);
      await loadPosts();
      if (!error.message?.toLowerCase().includes("duplicate")) {
        alert(error.message || "Couldn't save that — please try again.");
      }
      return;
    }

    // Reconcile with the server's real count rather than trusting the
    // optimistic math, so the number shown always matches what's stored.
    await loadPosts();
  }

  async function handleAdminUnlock() {
    if (!passwordInput || adminSubmitting) return;
    setAdminSubmitting(true);
    setAdminError(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAdminError(json.error ?? "Incorrect admin password.");
        return;
      }
      login(passwordInput);
      setPasswordInput("");
      setAdminSheetOpen(false);
    } catch {
      setAdminError("Network error, please try again.");
    } finally {
      setAdminSubmitting(false);
    }
  }

  function handleAdminExit() {
    if (!window.confirm("Exit admin mode?")) return;
    logout();
  }

  const visiblePosts = useMemo(() => {
    let list = filter === "all" ? posts : posts.filter((p) => p.category === filter);
    if (sort === "top") {
      list = [...list].sort((a, b) => b.likes_count - a.likes_count);
    }
    return list;
  }, [posts, filter, sort]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-28">
      <header className="sticky top-0 z-10 -mx-4 border-b border-ink-700 bg-ink-950/85 px-4 pb-3 pt-5 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <Logo />
          {isAdmin ? (
            <button
              onClick={handleAdminExit}
              title="Admin mode, tap to exit"
              className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-full border border-gold-600/50 bg-gold-liquid-soft/[0.12] px-2.5 py-1.5 text-[11px] font-medium text-gold-300"
            >
              <ShieldCheck size={13} strokeWidth={2.4} />
              Admin
            </button>
          ) : (
            <button
              onClick={() => setAdminSheetOpen(true)}
              title="Become admin"
              aria-label="Become admin"
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-600 text-ink-400 hover:border-gold-600/50 hover:text-gold-300"
            >
              <Lock size={14} strokeWidth={2.2} />
            </button>
          )}
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
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                sort === "new" ? "bg-gold-liquid-soft text-ink-950" : "text-ink-400"
              }`}
            >
              <Clock size={13} strokeWidth={2.2} />
            </button>
            <button
              title="Top"
              aria-pressed={sort === "top"}
              onClick={() => setSort("top")}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                sort === "top" ? "bg-gold-liquid-soft text-ink-950" : "text-ink-400"
              }`}
            >
              <TrendingUp size={13} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {latestArticle && (
        <Link
          href="/transparency"
          className="group mt-4 block rounded-xl bg-gold-liquid-soft p-[1.5px] shadow-gold transition-transform active:scale-[0.99]"
        >
          <div className="rounded-[10px] bg-ink-900 p-3.5 transition-colors group-hover:bg-ink-900/90">
            <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gold-300">
              <ShieldCheck size={11} strokeWidth={2.4} />
              From the Archives
            </div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-sm font-bold leading-snug text-[#f2ecdb]">
                  {latestArticle.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-400">
                  {latestArticle.body.split(/\n\s*\n/)[0]}
                </p>
              </div>
              <ChevronRight
                size={16}
                strokeWidth={2.4}
                className="mt-0.5 shrink-0 text-gold-300 transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </div>
        </Link>
      )}

      <PullToRefresh onRefresh={loadPosts}>
        <section className="mt-4 flex flex-col gap-2.5">
          {loading && <FeedSkeleton />}

          {!loading && visiblePosts.length === 0 && (
            <EmptyState
              icon={<Inbox size={20} strokeWidth={2} />}
              message="Nothing here yet — be the first to raise it."
            />
          )}

          {!loading && visiblePosts.length > 0 && (
            <div key={`${filter}-${sort}`} className="flex flex-col divide-y divide-ink-400">
              {visiblePosts.map((post) => (
                <div key={post.id} className="animate-fade-slide-in first:pt-0">
                  <PostCard
                    post={post}
                    liked={liked.has(post.id)}
                    onToggleLike={toggleLike}
                    isAdmin={isAdmin}
                    adminPassword={adminPassword}
                    onChanged={loadPosts}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </PullToRefresh>

      <FAB onClick={() => setComposerOpen(true)} label="New post" />

      <BottomSheet open={composerOpen} onClose={() => setComposerOpen(false)} title="New post">
        <Composer
          onSubmit={handleCreate}
          existingPosts={posts}
          onSupportExisting={(post) => {
            if (!liked.has(post.id)) toggleLike(post.id);
            setComposerOpen(false);
          }}
        />
      </BottomSheet>

      <BottomSheet
        open={adminSheetOpen}
        onClose={() => {
          setAdminSheetOpen(false);
          setPasswordInput("");
          setAdminError(null);
        }}
        title="Council admin"
      >
        <div className="flex flex-col gap-2.5">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdminUnlock();
            }}
            placeholder="Admin password"
            className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-[#f2ecdb] placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
          />
          {adminError && <p className="text-xs text-blood-400">{adminError}</p>}
          <button
            onClick={handleAdminUnlock}
            disabled={!passwordInput || adminSubmitting}
            className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-gold-liquid-soft text-sm font-medium text-ink-950 transition-opacity disabled:opacity-40"
          >
            <ShieldCheck size={14} strokeWidth={2.4} />
            {adminSubmitting ? "Checking…" : "Unlock admin mode"}
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}
