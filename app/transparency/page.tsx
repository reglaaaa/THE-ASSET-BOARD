"use client";

import { useEffect, useState } from "react";
import { Lock, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { supabase, type Article } from "@/lib/supabaseClient";
import { Logo } from "@/components/Logo";
import { EmptyState } from "@/components/EmptyState";

export default function TransparencyPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const [composerOpen, setComposerOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kept only in memory for this tab's session, so admins don't have to
  // retype the password for every delete after they've posted once.
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();

    const channel = supabase
      .channel("articles-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "articles" }, () => {
        loadArticles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadArticles() {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setArticles(data as Article[]);
    setLoading(false);
  }

  async function handlePost() {
    setError(null);
    if (!password || !title.trim() || !body.trim()) {
      setError("Password, title, and body are all required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          title: title.trim(),
          body: body.trim(),
          image_url: imageUrl.trim() || undefined
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }
      setUnlockedPassword(password);
      setTitle("");
      setBody("");
      setImageUrl("");
      setPassword("");
      setComposerOpen(false);
      await loadArticles();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const pwd = unlockedPassword ?? window.prompt("Admin password to delete this post:");
    if (!pwd) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;

    const res = await fetch("/api/articles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd, id })
    });

    if (res.ok) {
      setUnlockedPassword(pwd);
      await loadArticles();
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error ?? "Couldn't delete that post.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col px-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 border-b border-ink-700 bg-ink-950/85 px-4 pb-3 pt-5 backdrop-blur">
        <Logo />
        <p className="mt-1.5 text-xs tracking-wide text-ink-400">
          Transparency — council projects, updates, and how things are moving.
        </p>
      </header>

      <section className="mt-4">
        {!composerOpen ? (
          <button
            onClick={() => setComposerOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-600 py-3 text-xs font-medium text-ink-400 hover:border-gold-600/50 hover:text-gold-300"
          >
            <Lock size={13} strokeWidth={2.2} />
            Council admin? Post an update
          </button>
        ) : (
          <div className="rounded-xl border border-ink-600 bg-ink-800/60 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-300">
                <Lock size={13} strokeWidth={2.2} />
                New transparency post
              </span>
              <button
                onClick={() => {
                  setComposerOpen(false);
                  setError(null);
                }}
                aria-label="Close"
                className="text-ink-400 hover:text-blood-400"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-[#f2ecdb] placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
              />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                maxLength={200}
                className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-[#f2ecdb] placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
              />
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Thumbnail image URL (optional)"
                className="rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-[#f2ecdb] placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What happened, what's the update..."
                rows={4}
                maxLength={8000}
                className="resize-none rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-[#f2ecdb] placeholder:text-ink-400 focus:border-gold-500 focus:outline-none"
              />

              {error && <p className="text-xs text-blood-400">{error}</p>}

              <button
                onClick={handlePost}
                disabled={submitting}
                className="flex h-9 items-center justify-center gap-1.5 rounded-full bg-gold-liquid-soft text-sm font-medium text-ink-950 transition-opacity disabled:opacity-40"
              >
                <Plus size={14} strokeWidth={2.4} />
                {submitting ? "Posting…" : "Publish"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-5 flex flex-col gap-4">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-xl border border-ink-600 bg-ink-800/60"
            >
              <div className="h-44 w-full bg-ink-700" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded bg-ink-700" />
                <div className="h-3 w-1/4 rounded bg-ink-700" />
                <div className="h-3 w-full rounded bg-ink-700" />
                <div className="h-3 w-5/6 rounded bg-ink-700" />
              </div>
            </div>
          ))}

        {!loading && articles.length === 0 && (
          <EmptyState
            icon={<ShieldCheck size={20} strokeWidth={2} />}
            message="No transparency posts yet — check back soon."
          />
        )}

        {articles.map((a) => (
          <article
            key={a.id}
            className="animate-fade-slide-in overflow-hidden rounded-xl border border-ink-600 bg-ink-800/60"
          >
            {a.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.image_url}
                alt={a.title}
                className="h-44 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
            <div className="p-4">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <h2 className="font-display text-base font-bold leading-snug text-[#f2ecdb]">
                  {a.title}
                </h2>
                <button
                  onClick={() => handleDelete(a.id)}
                  aria-label="Delete post"
                  title="Delete (admin only)"
                  className="shrink-0 text-ink-400 hover:text-blood-400"
                >
                  <Trash2 size={14} strokeWidth={2.2} />
                </button>
              </div>
              <p className="mb-2 text-[11px] text-ink-400">
                {new Date(a.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#f2ecdb]/90">
                {a.body}
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
