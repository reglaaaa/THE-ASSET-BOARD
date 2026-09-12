export function PostCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-ink-600 bg-ink-800/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-ink-700" />
        <div className="h-3 w-8 rounded bg-ink-700" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-ink-700" />
        <div className="h-3 w-11/12 rounded bg-ink-700" />
        <div className="h-3 w-2/3 rounded bg-ink-700" />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <div className="h-7 w-14 rounded-full bg-ink-700" />
        <div className="h-7 w-10 rounded-full bg-ink-700" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
