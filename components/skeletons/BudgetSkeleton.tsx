function ExpandCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-ink-600 bg-ink-800/60 p-4">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-ink-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 rounded bg-ink-700" />
          <div className="h-3 w-20 rounded bg-ink-700" />
        </div>
      </div>
    </div>
  );
}

export function BudgetSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="animate-pulse h-11 rounded-xl border border-dashed border-ink-600 bg-ink-800/40" />
      <ExpandCardSkeleton />
      <ExpandCardSkeleton />
      <div className="animate-pulse rounded-xl border border-ink-600 bg-ink-800/60 p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-ink-700" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-28 rounded bg-ink-700" />
            <div className="h-3 w-36 rounded bg-ink-700" />
          </div>
        </div>
        <div className="mt-3 h-6 w-24 rounded bg-ink-700" />
      </div>
      <ExpandCardSkeleton />
    </div>
  );
}
