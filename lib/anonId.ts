// A random id stored only in this browser's localStorage.
// It is not tied to any account or identity — it just stops
// the same device from liking a post twice.
export function getAnonId(): string {
  if (typeof window === "undefined") return "server";
  const key = "asset_anon_id";
  let id = window.localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(key, id);
  }
  return id;
}

export function getLikedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem("asset_liked_posts");
  return new Set(raw ? JSON.parse(raw) : []);
}

export function persistLiked(set: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("asset_liked_posts", JSON.stringify(Array.from(set)));
}

// --- Soft frequency warnings (client-side only) ---------------------------
// These are gentle nudges, not enforcement — the server's own rate limits
// (see check_rate_limit in the comments_and_security migration) are what
// actually stop abuse. This just tracks recent timestamps in localStorage
// so the UI can ask "are you sure?" before someone posts/comments again
// in a short window.

const ONE_HOUR_MS = 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const POST_TIMES_KEY = "asset_recent_post_times";
const COMMENT_TIMES_KEY = "asset_recent_comment_times";

function readTimes(key: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

function prune(key: string, windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  const kept = readTimes(key).filter((t) => t > cutoff);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(kept));
  }
  return kept;
}

// How many posts this device has made in the last hour.
export function recentPostCount(): number {
  return prune(POST_TIMES_KEY, ONE_HOUR_MS).length;
}

// Call after a post successfully goes through.
export function recordPost() {
  if (typeof window === "undefined") return;
  const times = prune(POST_TIMES_KEY, ONE_HOUR_MS);
  times.push(Date.now());
  window.localStorage.setItem(POST_TIMES_KEY, JSON.stringify(times));
}

// How many comments this device has made in the last 10 minutes.
export function recentCommentCount(): number {
  return prune(COMMENT_TIMES_KEY, TEN_MINUTES_MS).length;
}

// Call after a comment successfully goes through.
export function recordComment() {
  if (typeof window === "undefined") return;
  const times = prune(COMMENT_TIMES_KEY, TEN_MINUTES_MS);
  times.push(Date.now());
  window.localStorage.setItem(COMMENT_TIMES_KEY, JSON.stringify(times));
}
