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
