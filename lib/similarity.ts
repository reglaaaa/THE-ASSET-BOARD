// Lightweight, dependency-free "is this a duplicate?" check.
//
// No AI/API calls — just word-overlap (Jaccard similarity) between the
// draft the person is typing and existing posts already loaded on the
// page. Good enough to catch "someone already said basically this" for a
// short-form feedback wall, without any extra cost or network calls.

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "at", "for", "and", "or", "but", "so", "not",
  "no", "it", "its", "this", "that", "there", "with", "as", "by", "we",
  "i", "you", "they", "our", "us", "have", "has", "had", "do", "does",
  "did", "please", "can", "could", "would", "should", "will", "just",
  "also", "very", "really", "again", "still"
]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

// Jaccard similarity: overlap size divided by union size, 0..1.
export function similarity(a: string, b: string): number {
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const word of setA) {
    if (setB.has(word)) overlap++;
  }
  const union = setA.size + setB.size - overlap;
  return union === 0 ? 0 : overlap / union;
}

export type SimilarMatch<T> = { item: T; score: number };

// Returns existing items whose content is similar enough to `draft`,
// best matches first. Only bothers once the draft has enough words to
// give a meaningful signal.
export function findSimilar<T>(
  draft: string,
  items: T[],
  getText: (item: T) => string,
  { threshold = 0.3, minDraftWords = 3, limit = 2 } = {}
): SimilarMatch<T>[] {
  if (tokenize(draft).size < minDraftWords) return [];

  return items
    .map((item) => ({ item, score: similarity(draft, getText(item)) }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
